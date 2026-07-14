// components/static/areas/GoogleMapLoader.tsx
"use client";

import dynamic from "next/dynamic";

// Match the props shape of your existing GoogleMapDirections component
interface GoogleMapLoaderProps {
  fromLocation: string;
  fromLat: number;
  fromLng: number;
  distance: string;
  duration: string;
}

const GoogleMapDirections = dynamic(
  () => import("@/components/global/GoogleMapDirections"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-2xl text-gray-400 text-sm">
        Loading map…
      </div>
    ),
  },
);

export default function GoogleMapLoader(props: GoogleMapLoaderProps) {
  return <GoogleMapDirections {...props} />;
}
