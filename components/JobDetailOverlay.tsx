'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseButton } from '@/components/CloseButton';
import ContractorCard from '@/components/ContractorCard';
import ContractorProfileOverlay from '@/components/ContractorProfileOverlay';
import JobRatingModal, { RatingData } from '@/components/JobRatingModal';
import { supabase } from '@/lib/supabaseClient';
import maplibregl from 'maplibre-gl';
import {
  IconWrench,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconBarChart,
  IconUsers,
  IconFlame,
  IconSnowflake
} from '@/components/Icons';

// Section refs type
interface SectionRefs {
  jobDetails: HTMLDivElement | null;
  description: HTMLDivElement | null;
  technicians: HTMLDivElement | null;
}

// Helper function to increase brightness and decrease saturation of rgba color
function getBrighterColor(rgbaColor: string, brightnessFactor: number): string {
  // Parse rgba color string like "rgba(245, 158, 11, 0.2)"
  const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgbaColor;

  let [, rStr, gStr, bStr, a] = match;
  let r = parseInt(rStr) / 255;
  let g = parseInt(gStr) / 255;
  let b = parseInt(bStr) / 255;

  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Decrease saturation by 51% total (30% + another 30% of remaining)
  s = Math.max(0, s * 0.49);

  // Increase lightness by brightness factor
  l = Math.min(1, l * brightnessFactor);

  // Convert HSL back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let newR, newG, newB;
  if (s === 0) {
    newR = newG = newB = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1/3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1/3);
  }

  const finalR = Math.round(newR * 255);
  const finalG = Math.round(newG * 255);
  const finalB = Math.round(newB * 255);

  // Return with same alpha
  return a ? `rgba(${finalR}, ${finalG}, ${finalB}, ${a})` : `rgb(${finalR}, ${finalG}, ${finalB})`;
}

interface JobDetailOverlayProps {
  job: {
    id: string;
    job_title: string;
    trade_needed: string | null;
    address_text: string | null;
    city: string | null;
    state: string | null;
    job_status: string | null;
    scheduled_at: string | null;
    description: string | null;
    created_at: string;
    urgency?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
  };
  onClose: () => void;
  onStatusChange?: () => void;
}

interface DispatchedTechnician {
  id: string;
  name: string;
  distance: number;
  rating: number;
  skills: string[];
}

export function JobDetailOverlay({ job, onClose, onStatusChange }: JobDetailOverlayProps) {
  const [outreachId, setOutreachId] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<DispatchedTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(job.job_status || 'pending');
  const [assignedTechId, setAssignedTechId] = useState<string | null>(null);
  const [technicianPositions, setTechnicianPositions] = useState<Map<string, [number, number]>>(new Map());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFullWorkOrder, setShowFullWorkOrder] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const statusColors: Record<string, string> = {
    pending: 'rgba(138, 134, 219, 0.5)',     // 50% opacity
    unassigned: 'rgba(138, 134, 219, 0.5)',  // Same as pending
    assigned: 'rgba(247, 177, 60, 0.5)',     // 50% opacity
    completed: 'rgba(60, 200, 150, 0.5)',    // 50% opacity
    archived: 'rgba(179, 179, 186, 0.5)',    // 50% opacity
  };

  const status = currentStatus.toLowerCase();
  const statusColor = statusColors[status] || statusColors.pending;

  // Get color palette based on status
  const getColorPalette = (status: string) => {
    const statusLower = status.toLowerCase();

    if (statusLower === 'assigned' || statusLower === 'active' || statusLower === 'in_progress') {
      // Orange fills for assigned - 50% reduced opacity (0.2 → 0.1)
      return {
        background: 'rgba(245, 158, 11, 0.1)',  // Orange tint 50% reduced
        border: 'rgba(249, 243, 229, 0.33)',  // Same stroke as unassigned
        cardBg: 'rgba(245, 158, 11, 0.1)',  // Orange card backgrounds 50% reduced
        statusBorder: 'rgba(247, 177, 60, 0.5)',  // Status badge uses orange with 50% opacity
        labelColor: 'rgba(245, 158, 11, 0.9)'  // Orange labels with high opacity
      };
    } else if (statusLower === 'completed') {
      // Green fills for completed - 50% reduced opacity (0.14 → 0.07)
      return {
        background: 'rgba(16, 185, 129, 0.07)',
        border: 'rgba(249, 243, 229, 0.33)',
        cardBg: 'rgba(16, 185, 129, 0.07)',
        statusBorder: 'rgba(60, 200, 150, 0.5)',  // 50% opacity
        labelColor: 'rgba(16, 185, 129, 0.9)'
      };
    } else if (statusLower === 'archived') {
      // Gray fills for archived - 50% reduced opacity (0.2 → 0.1)
      return {
        background: 'rgba(160, 160, 168, 0.1)',
        border: 'rgba(249, 243, 229, 0.33)',
        cardBg: 'rgba(160, 160, 168, 0.1)',
        statusBorder: 'rgba(179, 179, 186, 0.5)',  // 50% opacity
        labelColor: 'rgba(160, 160, 168, 0.9)'
      };
    } else {
      // Purple fills for unassigned/pending - 50% reduced opacity (0.2 → 0.1)
      return {
        background: 'rgba(101, 98, 144, 0.1)',
        border: 'rgba(249, 243, 229, 0.33)',
        cardBg: 'rgba(101, 98, 144, 0.1)',
        statusBorder: 'rgba(138, 134, 219, 0.5)',  // 50% opacity
        labelColor: '#ADA9DB'  // Purple labels
      };
    }
  };

  const colorPalette = getColorPalette(status);

  // Handle technician assignment via API
  const handleAssignTechnician = async (techId: string) => {
    console.log('[ASSIGN] Starting assignment process for tech:', techId, 'job:', job.id);

    // Set assigned tech ID to trigger animation
    setAssignedTechId(techId);
    console.log('[ASSIGN] assignedTechId state set to:', techId);

    try {
      // Use authoritative API route for assignment
      console.log('[ASSIGN] Calling /api/jobs/:id/assign...');
      const response = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_id: techId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ASSIGN] API error:', errorData);
        // Revert optimistic update
        setAssignedTechId(null);
        alert('Failed to assign technician: ' + (errorData.error || 'Unknown error'));
        return;
      }

      const { job: updatedJob } = await response.json();
      console.log('[ASSIGN] API response:', updatedJob);

      // Update local state to reflect the change
      setCurrentStatus('assigned');
      console.log('[ASSIGN] Local state updated to assigned');

      // Notify parent component to refresh job list
      console.log('[ASSIGN] Calling onStatusChange callback');
      onStatusChange?.();
      console.log('[ASSIGN] Assignment complete!');
    } catch (err) {
      console.error('[ASSIGN] Error assigning technician:', err);
      // Revert optimistic update
      setAssignedTechId(null);
      alert('Failed to assign technician: ' + (err as Error).message);
    }
  };

  const handleSubmitRating = async (ratingData: RatingData) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit rating');
      }

      console.log('[RATING] Rating submitted successfully');
      setShowRatingModal(false);
      setHasExistingRating(true);
    } catch (err) {
      console.error('[RATING] Error submitting rating:', err);
      throw err; // Re-throw to let modal handle the error display
    }
  };

  // Fetch the work_order_outreach ID and dispatched technicians
  useEffect(() => {
    async function fetchData() {
      try {
        // Get outreach ID and assigned tech ID
        const { data: jobData } = await supabase
          .from('jobs')
          .select('assigned_tech_id')
          .eq('id', job.id)
          .single();

        // If job is already assigned, set the assigned tech ID
        if (jobData?.assigned_tech_id) {
          console.log('[JobDetailOverlay] Job already assigned to:', jobData.assigned_tech_id);
          setAssignedTechId(jobData.assigned_tech_id);
        }

        const { data: outreachData } = await supabase
          .from('work_order_outreach')
          .select('id')
          .eq('job_id', job.id)
          .single();

        if (outreachData) {
          setOutreachId(outreachData.id);
        }

        // Fetch technicians from API
        const response = await fetch(`/api/jobs/${job.id}/technicians`);
        const data = await response.json();

        console.log('[JobDetailOverlay] API Response:', data);

        if (data.technicians && data.technicians.length > 0) {
          console.log('[JobDetailOverlay] Loaded real technicians:', data.technicians);
          setTechnicians(data.technicians);
        } else if (jobData?.assigned_tech_id) {
          // If job is assigned but no technicians from outreach, fetch the assigned tech directly
          console.log('[JobDetailOverlay] Fetching assigned technician directly');
          const { data: techData } = await supabase
            .from('technicians')
            .select('*')
            .eq('id', jobData.assigned_tech_id)
            .single();

          if (techData) {
            setTechnicians([{
              id: techData.id,
              name: techData.name || 'Unknown',
              distance: 0, // We don't have distance data for direct assignments
              rating: 4.5,
              skills: techData.trades?.split(',') || []
            }]);
          }
        } else {
          console.log('[JobDetailOverlay] No technicians found for this job');
          setTechnicians([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    }
    fetchData();
  }, [job.id]);

  // Initialize Maplibre map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || technicians.length === 0) return;

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const initialCenter: [number, number] = [-98.5795, 39.8283]; // Center of US

    // Create map with custom purple styling
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
      center: initialCenter,
      zoom: 16,
      attributionControl: false
    });

    // Customize the style after map loads
    mapRef.current.on('load', () => {
      if (!mapRef.current) return;

      // Resize map to fit container and animate zoom out
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
          mapRef.current.easeTo({
            zoom: 12,
            duration: 1500,
            easing: (t) => t * (2 - t)
          });
        }
      }, 100);

      const style = mapRef.current.getStyle();
      const layers = style.layers;

      // Apply custom styling to map layers
      layers?.forEach((layer: any) => {
        const isRoad = layer.type === 'line' &&
          (layer.id.includes('road') || layer.id.includes('highway') || layer.id.includes('Highway') ||
           layer.id.includes('tunnel') || layer.id.includes('bridge') || layer.id.includes('Pier road'));

        const isBuilding = (layer.type === 'fill' || layer.type === 'fill-extrusion') &&
          (layer.id === 'Building' || layer.id.includes('Building'));

        const isHousenumber = layer.id === 'Housenumber';
        const isRoadLabel = layer.id === 'Road labels';

        const isLand = layer.type === 'fill' &&
          (layer.id.includes('Residential') || layer.id.includes('Industrial') ||
           layer.id.includes('Grass') || layer.id.includes('Park') ||
           layer.id.includes('Pedestrian') || layer.id.includes('Cemetery') ||
           layer.id.includes('Hospital') || layer.id.includes('Stadium') ||
           layer.id.includes('School') || layer.id.includes('Airport'));

        if (isRoad) {
          try {
            mapRef.current?.setPaintProperty(layer.id, 'line-color', '#d4d4d4');
            mapRef.current?.setPaintProperty(layer.id, 'line-opacity', 0.4);
          } catch (e) {}
        } else if (isBuilding) {
          try {
            const buildingColor = layer.id === 'Building 3D' ? '#d4d4d4' : '#b8b8b8';
            if (layer.id === 'Building 3D') {
              mapRef.current?.setPaintProperty(layer.id, 'fill-extrusion-color', buildingColor);
              mapRef.current?.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.6);
            } else {
              mapRef.current?.setPaintProperty(layer.id, 'fill-color', buildingColor);
              mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0.6);
            }
          } catch (e) {}
        } else if (isHousenumber) {
          try {
            mapRef.current?.setPaintProperty(layer.id, 'text-color', '#FFFFFF');
            mapRef.current?.setPaintProperty(layer.id, 'text-halo-color', 'rgba(47, 47, 47, 0.8)');
            mapRef.current?.setPaintProperty(layer.id, 'text-halo-width', 1.5);
            mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 1);
          } catch (e) {}
        } else if (isRoadLabel) {
          try {
            mapRef.current?.setPaintProperty(layer.id, 'text-color', '#ffffff');
            mapRef.current?.setPaintProperty(layer.id, 'text-halo-width', 0);
            mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 1);
          } catch (e) {}
        } else if (isLand) {
          try {
            mapRef.current?.setPaintProperty(layer.id, 'fill-color', '#d4d4d4');
            mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0.2);
          } catch (e) {}
        } else {
          try {
            if (layer.type === 'fill') {
              mapRef.current?.setPaintProperty(layer.id, 'fill-opacity', 0);
            } else if (layer.type === 'line') {
              mapRef.current?.setPaintProperty(layer.id, 'line-opacity', 0);
            } else if (layer.type === 'symbol') {
              mapRef.current?.setPaintProperty(layer.id, 'text-opacity', 0);
              mapRef.current?.setPaintProperty(layer.id, 'icon-opacity', 0);
            } else if (layer.type === 'background') {
              mapRef.current?.setPaintProperty(layer.id, 'background-opacity', 0);
            }
          } catch (e) {}
        }
      });

      // Add white job location marker (30% smaller)
      const jobMarkerEl = document.createElement('div');
      jobMarkerEl.style.width = '21.7px'; // 31 * 0.7
      jobMarkerEl.style.height = '28px'; // 40 * 0.7
      jobMarkerEl.innerHTML = `
        <svg width="21.7" height="28" viewBox="0 0 31 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M15.4766 4C9.066 4 3.86916 9.37258 3.86916 16C3.86916 18.0557 4.57324 20.3536 5.76796 22.7356C6.95398 25.1003 8.5578 27.4183 10.199 29.4786C11.8354 31.5329 13.4773 33.2914 14.7121 34.5376C14.9897 34.8178 15.2461 35.0715 15.4766 35.2962C15.7071 35.0715 15.9636 34.8178 16.2412 34.5376C17.476 33.2914 19.1179 31.5329 20.7543 29.4786C22.3955 27.4183 23.9993 25.1003 25.1853 22.7356C26.38 20.3536 27.0841 18.0557 27.0841 16C27.0841 9.37258 21.8873 4 15.4766 4ZM15.4766 38C14.2176 39.5185 14.2173 39.5182 14.2169 39.5179L14.2128 39.5142L14.203 39.5055L14.1691 39.4752C14.1402 39.4492 14.0988 39.4118 14.0457 39.3635C13.9396 39.2669 13.7869 39.1264 13.5941 38.9454C13.2088 38.5836 12.6627 38.0593 12.0093 37.3999C10.705 36.0836 8.96131 34.2171 7.21225 32.0214C5.4679 29.8317 3.68621 27.2747 2.33309 24.5769C0.988679 21.8964 0 18.9443 0 16C0 7.16344 6.92913 0 15.4766 0C24.0241 0 30.9533 7.16344 30.9533 16C30.9533 18.9443 29.9646 21.8964 28.6202 24.5769C27.2671 27.2747 25.4854 29.8317 23.741 32.0214C21.992 34.2171 20.2483 36.0836 18.944 37.3999C18.2906 38.0593 17.7445 38.5836 17.3591 38.9454C17.1664 39.1264 17.0136 39.2669 16.9075 39.3635C16.8545 39.4118 16.8131 39.4492 16.7842 39.4752L16.7502 39.5055L16.7405 39.5142L16.7374 39.5169C16.737 39.5173 16.7356 39.5185 15.4766 38ZM15.4766 38L14.2169 39.5179C14.9414 40.1598 16.0112 40.1605 16.7356 39.5185L15.4766 38ZM15.4766 12C13.3398 12 11.6075 13.7909 11.6075 16C11.6075 18.2091 13.3398 20 15.4766 20C17.6135 20 19.3458 18.2091 19.3458 16C19.3458 13.7909 17.6135 12 15.4766 12ZM7.73832 16C7.73832 11.5817 11.2029 8 15.4766 8C19.7504 8 23.215 11.5817 23.215 16C23.215 20.4183 19.7504 24 15.4766 24C11.2029 24 7.73832 20.4183 7.73832 16Z" fill="#FFFFFF"/>
        </svg>
      `;

      new maplibregl.Marker({ element: jobMarkerEl, anchor: 'bottom' })
        .setLngLat(initialCenter)
        .addTo(mapRef.current!);

      // Add technician markers - show only assigned tech if one is assigned, otherwise show all
      console.log('[MAP] assignedTechId:', assignedTechId);
      const techsToShow = assignedTechId
        ? technicians.filter(t => t.id === assignedTechId)
        : technicians;

      console.log('[MAP] techsToShow:', techsToShow.length, 'techs');

      const techColors = ['#83C596', '#C5839C', '#B8C583', '#83C596', '#C5AC83'];
      const techLocations: Array<{ lng: number; lat: number }> = [];

      techsToShow.forEach((tech, index) => {
        // Check if we already have a position for this technician, otherwise generate one
        let techLng: number, techLat: number;

        if (technicianPositions.has(tech.id)) {
          const pos = technicianPositions.get(tech.id)!;
          techLng = pos[0];
          techLat = pos[1];
          console.log('[MAP] Reusing position for tech', tech.id, ':', techLng, techLat);
        } else {
          // Generate new random position
          const offsetLat = (Math.random() - 0.5) * 0.02;
          const offsetLng = (Math.random() - 0.5) * 0.02;
          techLng = initialCenter[0] + offsetLng;
          techLat = initialCenter[1] + offsetLat;

          // Store for future use
          setTechnicianPositions(prev => new Map(prev).set(tech.id, [techLng, techLat]));
          console.log('[MAP] Generated new position for tech', tech.id, ':', techLng, techLat);
        }

        // Store location for route drawing
        techLocations.push({ lng: techLng, lat: techLat });

        // Use green for assigned tech, otherwise use color from array
        const techColor = assignedTechId ? '#10B981' : techColors[index % techColors.length];
        const techMarkerEl = document.createElement('div');
        techMarkerEl.style.width = '15.5px'; // 31 * 0.5
        techMarkerEl.style.height = '20px'; // 40 * 0.5
        techMarkerEl.innerHTML = `
          <svg width="15.5" height="20" viewBox="0 0 31 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.4766 4C9.066 4 3.86916 9.37258 3.86916 16C3.86916 18.0557 4.57324 20.3536 5.76796 22.7356C6.95398 25.1003 8.5578 27.4183 10.199 29.4786C11.8354 31.5329 13.4773 33.2914 14.7121 34.5376C14.9897 34.8178 15.2461 35.0715 15.4766 35.2962C15.7071 35.0715 15.9636 34.8178 16.2412 34.5376C17.476 33.2914 19.1179 31.5329 20.7543 29.4786C22.3955 27.4183 23.9993 25.1003 25.1853 22.7356C26.38 20.3536 27.0841 18.0557 27.0841 16C27.0841 9.37258 21.8873 4 15.4766 4ZM15.4766 38C14.2176 39.5185 14.2173 39.5182 14.2169 39.5179L14.2128 39.5142L14.203 39.5055L14.1691 39.4752C14.1402 39.4492 14.0988 39.4118 14.0457 39.3635C13.9396 39.2669 13.7869 39.1264 13.5941 38.9454C13.2088 38.5836 12.6627 38.0593 12.0093 37.3999C10.705 36.0836 8.96131 34.2171 7.21225 32.0214C5.4679 29.8317 3.68621 27.2747 2.33309 24.5769C0.988679 21.8964 0 18.9443 0 16C0 7.16344 6.92913 0 15.4766 0C24.0241 0 30.9533 7.16344 30.9533 16C30.9533 18.9443 29.9646 21.8964 28.6202 24.5769C27.2671 27.2747 25.4854 29.8317 23.741 32.0214C21.992 34.2171 20.2483 36.0836 18.944 37.3999C18.2906 38.0593 17.7445 38.5836 17.3591 38.9454C17.1664 39.1264 17.0136 39.2669 16.9075 39.3635C16.8545 39.4118 16.8131 39.4492 16.7842 39.4752L16.7502 39.5055L16.7405 39.5142L16.7374 39.5169C16.737 39.5173 16.7356 39.5185 15.4766 38ZM15.4766 38L14.2169 39.5179C14.9414 40.1598 16.0112 40.1605 16.7356 39.5185L15.4766 38ZM15.4766 12C13.3398 12 11.6075 13.7909 11.6075 16C11.6075 18.2091 13.3398 20 15.4766 20C17.6135 20 19.3458 18.2091 19.3458 16C19.3458 13.7909 17.6135 12 15.4766 12ZM7.73832 16C7.73832 11.5817 11.2029 8 15.4766 8C19.7504 8 23.215 11.5817 23.215 16C23.215 20.4183 19.7504 24 15.4766 24C11.2029 24 7.73832 20.4183 7.73832 16Z" fill="${techColor}"/>
          </svg>
        `;

        new maplibregl.Marker({ element: techMarkerEl, anchor: 'bottom' })
          .setLngLat([techLng, techLat])
          .addTo(mapRef.current!);
      });

      // Draw white route line if a technician is assigned
      console.log('[MAP] Checking route line: assignedTechId:', assignedTechId, 'techLocations:', techLocations.length);
      if (assignedTechId && techLocations.length > 0) {
        const techLocation = techLocations[0];
        console.log('[MAP] Fetching road route from tech:', techLocation, 'to job:', initialCenter);

        // Fetch routing data from MapTiler Routing API
        const fetchRoute = async () => {
          try {
            const response = await fetch(
              `https://api.maptiler.com/routing?points=${techLocation.lng},${techLocation.lat};${initialCenter[0]},${initialCenter[1]}&vehicle=car&key=${maptilerKey}`
            );
            const data = await response.json();
            console.log('[MAP] Routing API response:', data);

            if (data.features && data.features.length > 0) {
              const routeGeometry = data.features[0].geometry;

              // Remove existing route if present
              try {
                if (mapRef.current!.getLayer('route')) {
                  mapRef.current!.removeLayer('route');
                }
                if (mapRef.current!.getSource('route')) {
                  mapRef.current!.removeSource('route');
                }
              } catch (e) {
                console.log('[MAP] No existing route to remove');
              }

              // Add route line source with actual road geometry
              mapRef.current!.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: routeGeometry
                }
              });

              mapRef.current!.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#FFFFFF',
                  'line-width': 3,
                  'line-opacity': 0.8
                }
              });
              console.log('[MAP] Road route added successfully');
            }
          } catch (error) {
            console.error('[MAP] Error fetching route:', error);
          }
        };

        fetchRoute();
      } else {
        console.log('[MAP] Not drawing route: assignedTechId or techLocations missing');
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [technicians, assignedTechId]);

  return (
    <motion.div
      className="policy-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        background: 'transparent',
        zIndex: 10002,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        className="policy-modal-card"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1100,
          maxHeight: '90vh',
          border: `1px solid ${colorPalette.border}`,
          borderRadius: 'var(--modal-border-radius)',
          overflow: 'auto',
          padding: 'var(--spacing-2xl)',
          position: 'relative',
          background: colorPalette.background,
          backdropFilter: 'var(--modal-backdrop-blur)',
          WebkitBackdropFilter: 'var(--modal-backdrop-blur)',
          transition: 'background 0.6s ease, border-color 0.6s ease'
        }}
      >
        {/* Action Buttons - Close and Refresh */}
        <div style={{
          position: 'absolute',
          top: 'var(--spacing-lg)',
          right: 'var(--spacing-lg)',
          display: 'flex',
          gap: 'var(--spacing-sm)',
          alignItems: 'center'
        }}>
          {/* View Details Button - Shows full work order text */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullWorkOrder(true);
            }}
            className="close-button"
            aria-label="View full work order"
            style={{ marginRight: 0 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="14 2 14 8 20 8"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Mark as Complete Button - Only show if not already completed */}
          {currentStatus.toLowerCase() !== 'completed' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();

                try {
                  // First check if there's an assigned technician
                  if (!assignedTechId) {
                    alert('Please assign a technician before marking the job as complete.');
                    return;
                  }

                  // Use authoritative API route for completion
                  console.log('[COMPLETE] Calling /api/jobs/:id/complete...');
                  const response = await fetch(`/api/jobs/${job.id}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    console.error('[COMPLETE] API error:', errorData);
                    alert('Failed to mark job as complete: ' + (errorData.error || 'Unknown error'));
                    return;
                  }

                  console.log('[COMPLETE] Job marked as complete');
                  setCurrentStatus('completed');

                  // Check if rating already exists
                  const ratingResponse = await fetch(`/api/jobs/${job.id}/rate`);
                  const ratingData = await ratingResponse.json();

                  if (!ratingData.hasRating) {
                    // Show rating modal if no rating exists
                    setShowRatingModal(true);
                  } else {
                    setHasExistingRating(true);
                  }

                  // Trigger refresh to update job list
                  if (onStatusChange) {
                    onStatusChange();
                  }
                } catch (err) {
                  console.error('[COMPLETE] Unexpected error:', err);
                  alert('Failed to mark job as complete');
                }
              }}
              style={{
                width: 40,
                height: 40,
                background: 'transparent',
                border: '1px solid #10B981',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                marginRight: 'var(--spacing-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.borderColor = '#3CC896';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              title="Mark as Complete"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}

          {/* Delete Button - Shows on all states */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="close-button"
            aria-label="Delete work order"
            style={{ marginRight: 0 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="10"
                y1="11"
                x2="10"
                y2="17"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="14"
                y1="11"
                x2="14"
                y2="17"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Refresh/Unassign Button - Only show for assigned jobs */}
          {currentStatus.toLowerCase() === 'assigned' && (
            <button
            onClick={async (e) => {
              e.stopPropagation();
              console.log('[UNASSIGN] Button clicked! Starting unassign process for job:', job.id);

              try {
                // Use authoritative API route for unassignment
                console.log('[UNASSIGN] Calling /api/jobs/:id/assign DELETE...');
                const response = await fetch(`/api/jobs/${job.id}/assign`, {
                  method: 'DELETE'
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('[UNASSIGN] API error:', errorData);
                  alert('Failed to unassign job: ' + (errorData.error || 'Unknown error'));
                  return;
                }

                console.log('[UNASSIGN] API response successful');

                // Update local state to reflect the change
                setCurrentStatus('pending');
                setAssignedTechId(null);
                console.log('[UNASSIGN] Local state updated');

                // Re-fetch technicians to show full list again
                console.log('[UNASSIGN] Fetching technicians...');
                const techResponse = await fetch(`/api/jobs/${job.id}/technicians`);
                const techData = await techResponse.json();

                if (techData.technicians && techData.technicians.length > 0) {
                  setTechnicians(techData.technicians);
                  console.log('[UNASSIGN] Technicians loaded:', techData.technicians.length);
                } else {
                  console.log('[UNASSIGN] No technicians returned from API');
                }

                console.log('[UNASSIGN] Unassign process complete!');
              } catch (err) {
                console.error('[UNASSIGN] Unexpected error:', err);
                alert('Unexpected error during unassign: ' + (err as Error).message);
              }
            }}
            className="close-button"
            aria-label="Unassign and refresh"
            style={{ marginRight: 0 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.5 2V8M21.5 8H16M21.5 8L18 4.5C16.5 3 14.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17 22 21 18.5 21.5 14"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          )}

          {/* Close Button */}
          <CloseButton onClick={onClose} />
        </div>


        {/* Loading State */}
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)' }}>
            {/* Header Skeleton */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <div style={{
                width: '200px',
                height: '20px',
                background: 'rgba(178, 173, 201, 0.2)',
                borderRadius: '4px',
                marginBottom: 'var(--spacing-lg)'
              }} />
              <div style={{
                width: '60%',
                height: '32px',
                background: 'rgba(178, 173, 201, 0.2)',
                borderRadius: '4px',
                marginBottom: 'var(--spacing-md)'
              }} />
              <div style={{
                width: '80%',
                height: '16px',
                background: 'rgba(178, 173, 201, 0.15)',
                borderRadius: '4px'
              }} />
            </div>

            {/* Info Cards Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  background: 'rgba(178, 173, 201, 0.1)',
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  height: '100px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '12px',
                    background: 'rgba(178, 173, 201, 0.2)',
                    borderRadius: '4px',
                    marginBottom: 'var(--spacing-sm)'
                  }} />
                  <div style={{
                    width: '120px',
                    height: '20px',
                    background: 'rgba(178, 173, 201, 0.25)',
                    borderRadius: '4px'
                  }} />
                </div>
              ))}
            </div>

            {/* Map Skeleton */}
            <div style={{
              width: '100%',
              height: '300px',
              background: 'rgba(178, 173, 201, 0.1)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              marginBottom: 'var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-sm)'
              }}>
                Loading map...
              </div>
            </div>

            {/* Technicians List Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  background: 'rgba(178, 173, 201, 0.1)',
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  height: '80px'
                }}>
                  <div style={{
                    width: '150px',
                    height: '16px',
                    background: 'rgba(178, 173, 201, 0.2)',
                    borderRadius: '4px',
                    marginBottom: 'var(--spacing-sm)'
                  }} />
                  <div style={{
                    width: '200px',
                    height: '12px',
                    background: 'rgba(178, 173, 201, 0.15)',
                    borderRadius: '4px'
                  }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
        {/* Header Section - Enhanced with better visual hierarchy */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          {/* Work Order Number & Status Badge - Inline */}
          <div className="job-detail-header-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div style={{
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--job-detail-card-label-spacing)',
              fontWeight: 'var(--font-weight-semibold)',
              opacity: 0.9
            }}>
              WO-{job.id.slice(0, 8).toUpperCase()}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--job-detail-status-badge-padding)',
                borderRadius: 'var(--job-detail-status-badge-radius)',
                background: `${colorPalette.statusBorder}22`,
                border: `1px solid ${colorPalette.statusBorder}`,
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--job-detail-card-label-spacing)',
                transition: 'all 0.6s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated shimmer background for "Matching" status */}
              {currentStatus.toLowerCase() === 'matching' && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                    pointerEvents: 'none'
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {currentStatus}
                {currentStatus.toLowerCase() === 'matching' && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    ...
                  </motion.span>
                )}
              </span>
            </div>
          </div>

          {/* Job Title */}
          <h1 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.2
          }}>
            {job.job_title}
          </h1>

          {/* Quick Info Cards - Compact 3-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
            {/* Trade Card */}
            <div
              style={{
                background: colorPalette.cardBg,
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-md)',
                transition: 'background 0.6s ease'
              }}
            >
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--job-detail-card-label-spacing)',
                marginBottom: 'var(--spacing-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <IconWrench />
                <span>Trade</span>
              </div>
              <div style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {job.trade_needed || 'Not specified'}
              </div>
            </div>

            {/* Location Card */}
            <div
              style={{
                background: colorPalette.cardBg,
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-md)',
                transition: 'background 0.6s ease'
              }}
            >
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--job-detail-card-label-spacing)',
                marginBottom: 'var(--spacing-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <IconMapPin />
                <span>Location</span>
              </div>
              <div style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {job.address_text || (job.city && job.state ? `${job.city}, ${job.state}` : 'Not specified')}
              </div>
            </div>

            {/* Scheduled Date Card */}
            <div
              style={{
                background: colorPalette.cardBg,
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-md)',
                transition: 'background 0.6s ease'
              }}
            >
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--job-detail-card-label-spacing)',
                marginBottom: 'var(--spacing-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <IconCalendar />
                <span>Scheduled</span>
              </div>
              <div style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {currentStatus.toLowerCase() === 'matching' ? (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Scheduling
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      ...
                    </motion.span>
                  </span>
                ) : job.scheduled_at
                  ? new Date(job.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not scheduled'}
              </div>
            </div>

            {/* Urgency Card */}
            {job.urgency && (
              <div
                style={{
                  background: colorPalette.cardBg,
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  transition: 'background 0.6s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--job-detail-card-label-spacing)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Urgency
                </div>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  textTransform: 'capitalize'
                }}>
                  {job.urgency.replace('_', ' ')}
                </div>
              </div>
            )}

            {/* Budget Card */}
            {(job.budget_min || job.budget_max) && (
              <div
                style={{
                  background: colorPalette.cardBg,
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  transition: 'background 0.6s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--job-detail-card-label-spacing)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Budget
                </div>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {job.budget_min && job.budget_max
                    ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
                    : job.budget_max
                    ? `Up to $${job.budget_max.toLocaleString()}`
                    : job.budget_min
                    ? `From $${job.budget_min.toLocaleString()}`
                    : 'Not specified'}
                </div>
              </div>
            )}

            {/* Contact Name Card */}
            {job.contact_name && (
              <div
                style={{
                  background: colorPalette.cardBg,
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  transition: 'background 0.6s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--job-detail-card-label-spacing)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Contact
                </div>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {job.contact_name}
                </div>
              </div>
            )}

            {/* Contact Email Card */}
            {job.contact_email && (
              <div
                style={{
                  background: colorPalette.cardBg,
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  transition: 'background 0.6s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--job-detail-card-label-spacing)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Email
                </div>
                <div style={{
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  {job.contact_email}
                </div>
              </div>
            )}

            {/* Contact Phone Card */}
            {job.contact_phone && (
              <div
                style={{
                  background: colorPalette.cardBg,
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  transition: 'background 0.6s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--job-detail-card-label-spacing)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Phone
                </div>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {job.contact_phone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Section - Improved styling */}
        {job.description && (
          <div style={{
            marginBottom: 'var(--spacing-xl)',
            padding: 'var(--spacing-lg)',
            background: 'var(--container-bg)',
            borderRadius: 'var(--container-border-radius)',
            border: 'var(--container-border)'
          }}>
            <div style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--job-detail-card-label-spacing)',
              marginBottom: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <IconFileText />
              <span>Description</span>
            </div>
            <div style={{
              fontSize: 'var(--font-md)',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              fontWeight: 'var(--font-weight-regular)',
              opacity: 0.9
            }}>
              {job.description}
            </div>
          </div>
        )}

        {/* Legacy Assigned Job Warning - No technician data */}
        {currentStatus.toLowerCase() === 'assigned' && technicians.length === 0 && !assignedTechId ? (
          <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-xl)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: '#F59E0B',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Legacy Assignment Detected
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                lineHeight: 1.5
              }}>
                This work order was assigned before the technician tracking system was implemented.
                No technician information or map is available for this assignment.
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                marginTop: 'var(--spacing-sm)',
                lineHeight: 1.5
              }}>
                To track the assigned technician, please re-assign this work order by changing the status to "Unassigned"
                and then assigning it to a technician from the list below.
              </div>
            </div>
          </div>
        ) : null}

        {/* Map and Technicians Section - Side by Side */}
        {currentStatus.toLowerCase() === 'matching' && technicians.length === 0 ? (
          // Loading state for "Matching" status - Empty container with shimmer
          <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-4xl)',
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            minHeight: '200px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated shimmer effect - synced with badge */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                pointerEvents: 'none'
              }}
            />
          </div>
        ) : technicians.length > 0 ? (
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            {/* Section Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'var(--font-text-body)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <IconUsers />
                <span>Contacted Technicians</span>
              </div>
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-lg)',
                alignItems: 'center'
              }}>
                {/* Average Distance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-regular)' }}>
                    {assignedTechId ? 'Distance:' : 'Avg Distance:'}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                    {assignedTechId
                      ? `${technicians.find(t => t.id === assignedTechId)?.distance.toFixed(1) || '0.0'} mi`
                      : `${(technicians.reduce((sum, t) => sum + t.distance, 0) / technicians.length).toFixed(1)} mi`
                    }
                  </span>
                </div>
                {/* Average Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-regular)' }}>
                    {assignedTechId ? 'Rating:' : 'Avg Rating:'}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                        fill="var(--text-primary)"
                      />
                    </svg>
                    {assignedTechId
                      ? technicians.find(t => t.id === assignedTechId)?.rating.toFixed(1) || '0.0'
                      : (technicians.reduce((sum, t) => sum + t.rating, 0) / technicians.length).toFixed(1)
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Split Layout: Map (Left) | Technician Cards (Right) */}
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
              {/* Left Side: Map Container */}
              <div
                ref={mapContainerRef}
                style={{
                  flex: '0 0 50%',
                  height: 'var(--dispatch-map-height)',
                  background: 'linear-gradient(135deg, rgba(178, 173, 201, 0.05) 0%, rgba(255, 255, 255, 0.08) 100%)',
                  border: '1px solid rgba(249, 243, 229, 0.33)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              />

              {/* Right Side: Technician Cards */}
              <div style={{
                flex: '0 0 50%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                maxHeight: 'var(--dispatch-map-height)',
                overflowY: 'auto',
                paddingRight: 'var(--spacing-xs)'
              }}>
                <AnimatePresence>
                  {technicians
                    .filter(tech => !assignedTechId || tech.id === assignedTechId)
                    .map((tech, index) => (
                      <motion.div
                        key={tech.id}
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.8,
                          x: tech.id !== assignedTechId ? -50 : 0,
                          transition: { duration: 0.4, ease: 'easeInOut' }
                        }}
                      >
                        <ContractorCard
                          id={tech.id}
                          name={tech.name}
                          distance={tech.distance}
                          rating={tech.rating}
                          skills={tech.skills}
                          index={index}
                          showAssignButton={!assignedTechId}
                          onCardClick={(techId) => setSelectedTechId(techId)}
                          onAssign={handleAssignTechnician}
                          isAssigned={tech.id === assignedTechId}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* Communications Timeline - Shows after assignment */}
                {assignedTechId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    style={{
                      marginTop: 'var(--spacing-lg)',
                      background: colorPalette.cardBg,
                      border: 'var(--container-border)',
                      borderRadius: 'var(--container-border-radius)',
                      padding: 'var(--spacing-lg)',
                      transition: 'background 0.6s ease'
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-text-body)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--job-detail-card-label-spacing)',
                      marginBottom: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>Communications Timeline</span>
                    </div>

                    {/* Timeline Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                      {/* Email Sent */}
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 'var(--spacing-xs)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--text-primary)',
                          border: 'none'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                            <div style={{
                              fontFamily: 'var(--font-text-body)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-sm)'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                              </svg>
                              <span>Email Sent (Cold Outreach)</span>
                            </div>
                            <div style={{
                              fontFamily: 'var(--font-text-body)',
                              fontSize: 'var(--font-xs)',
                              color: 'var(--text-secondary)'
                            }}>
                              2 hours ago
                            </div>
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-text-body)',
                            fontSize: 'var(--font-sm)',
                            color: getBrighterColor(colorPalette.cardBg, 2.5),
                            lineHeight: 1.5
                          }}>
                            Initial outreach email sent via Instantly campaign
                          </div>
                        </div>
                      </div>

                      {/* Email Opened */}
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 'var(--spacing-xs)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--text-primary)',
                          border: 'none'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                            <div style={{
                              fontFamily: 'var(--font-text-body)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-sm)'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              <span>Email Opened</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-text-body)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                              1 hour ago
                            </div>
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-text-body)',
                            fontSize: 'var(--font-sm)',
                            color: getBrighterColor(colorPalette.cardBg, 2.5),
                            lineHeight: 1.5
                          }}>
                            Technician opened the email and viewed job details
                          </div>
                        </div>
                      </div>

                      {/* AI Conversation */}
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 'var(--spacing-xs)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--text-primary)',
                          border: 'none'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                            <div style={{
                              fontFamily: 'var(--font-text-body)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-sm)'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                              <span>AI Qualification Call</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-text-body)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                              45 min ago
                            </div>
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-text-body)',
                            fontSize: 'var(--font-sm)',
                            color: getBrighterColor(colorPalette.cardBg, 2.5),
                            lineHeight: 1.5
                          }}>
                            OpenAI voice agent qualified technician - 4 min conversation
                          </div>
                          <button style={{
                            fontFamily: 'var(--font-text-body)',
                            marginTop: 'var(--spacing-xs)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            background: 'rgba(139, 92, 246, 0.03)',
                            border: '1px solid rgba(249, 243, 229, 0.5)',
                            borderRadius: 'var(--btn-corner-radius)',
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}>
                            View Transcript
                          </button>
                        </div>
                      </div>

                      {/* Technician Accepted */}
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 'var(--spacing-xs)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--text-primary)',
                          border: 'none'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                            <div style={{
                              fontFamily: 'var(--font-text-body)',
                              fontSize: 'var(--font-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-sm)'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                              <span>Technician Accepted Job</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-text-body)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                              Just now
                            </div>
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-text-body)',
                            fontSize: 'var(--font-sm)',
                            color: getBrighterColor(colorPalette.cardBg, 2.5),
                            lineHeight: 1.5
                          }}>
                            Technician confirmed availability and accepted the work order
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </>
    )}
      </motion.div>

      {/* Technician Profile Overlay - Rendered outside modal hierarchy */}
      <AnimatePresence>
        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <motion.div
            className="policy-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            style={{ zIndex: 2000 }}
          >
            <motion.div
              className="policy-modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 480,
                background: 'transparent',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                filter: 'brightness(1.3)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                padding: 'var(--spacing-2xl)'
              }}
            >
              {/* Warning Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.4">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--font-section-title)',
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                Delete Work Order?
              </h2>

              {/* Message */}
              <p style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: 'var(--spacing-sm)'
              }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{job.job_title}</strong>?
              </p>

              <p style={{
                fontSize: 'var(--font-sm)',
                color: '#EF4444',
                textAlign: 'center',
                marginBottom: 'var(--spacing-2xl)'
              }}>
                This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="outline-button"
                  style={{
                    padding: '12px 24px',
                    minWidth: '120px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async (e) => {
                    // Prevent multiple clicks
                    const button = e.currentTarget;
                    if (button.disabled) return;
                    button.disabled = true;
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';

                    console.log('[DELETE] Starting delete process for job:', job.id);

                    try {
                      // Call API endpoint to delete job (uses service role to bypass RLS)
                      const response = await fetch(`/api/jobs/${job.id}`, {
                        method: 'DELETE'
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        console.error('[DELETE] API error:', data);
                        alert('Failed to delete job: ' + (data.error || 'Unknown error'));
                        // Re-enable button on error
                        button.disabled = false;
                        button.style.opacity = '1';
                        button.style.cursor = 'pointer';
                        return;
                      }

                      console.log('[DELETE] Job deleted successfully');

                      // Trigger refresh to remove deleted job from list
                      if (onStatusChange) {
                        onStatusChange();
                      }

                      // Close both overlays immediately (don't wait for re-enable)
                      setShowDeleteConfirm(false);
                      onClose();
                    } catch (err) {
                      console.error('[DELETE] Unexpected error:', err);
                      alert('Unexpected error during deletion: ' + (err as Error).message);
                      // Re-enable button on error
                      button.disabled = false;
                      button.style.opacity = '1';
                      button.style.cursor = 'pointer';
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    minWidth: '120px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Work Order Text Overlay */}
        {showFullWorkOrder && (
          <motion.div
            className="policy-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullWorkOrder(false)}
            style={{ zIndex: 2000 }}
          >
            <motion.div
              className="policy-modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 800,
                maxHeight: '80vh',
                background: 'transparent',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                filter: 'brightness(1.3)',
                border: '2px solid rgba(101, 98, 144, 0.5)',
                padding: 'var(--spacing-2xl)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xl)'
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-section-title)',
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  Work Order Details
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullWorkOrder(false);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <line x1="4" y1="4" x2="16" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="16" y1="4" x2="4" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* WO Number */}
              <div style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-md)'
              }}>
                WO-{job.id.slice(0, 8).toUpperCase()}
              </div>

              {/* Scrollable Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                background: 'rgba(47, 47, 47, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
              }}>
                <pre style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  margin: 0
                }}>
                  {job.description || 'No work order text available.'}
                </pre>
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullWorkOrder(false);
                }}
                className="primary-button"
                style={{
                  padding: '12px 24px',
                  width: '100%'
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {showRatingModal && assignedTechId && (
          <JobRatingModal
            jobId={job.id}
            technicianId={assignedTechId}
            technicianName={technicians.find(t => t.id === assignedTechId)?.name || 'Technician'}
            onClose={() => setShowRatingModal(false)}
            onSubmit={handleSubmitRating}
          />
        )}

        {selectedTechId && (
          <ContractorProfileOverlay
            contractorId={selectedTechId}
            onClose={() => setSelectedTechId(null)}
            onAssign={async (contractorId) => {
              await handleAssignTechnician(contractorId);
              setSelectedTechId(null);
            }}
            jobDate={job?.scheduled_at ? new Date(job.scheduled_at) : undefined}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
