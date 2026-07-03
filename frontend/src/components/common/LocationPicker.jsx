import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { X } from "lucide-react";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationPicker = ({ onClose, onSelect }) => {
    const [position, setPosition] = useState([9.0765, 7.3986]); // Default: Abuja, Nigeria

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition([e.latlng.lat, e.latlng.lng]);
            },
        });
        return position ? <Marker position={position} /> : null;
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-4 w-[500px] shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Share Location</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="h-64 rounded-lg overflow-hidden mb-3">
                    <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker />
                    </MapContainer>
                </div>
                <p className="text-xs text-gray-500 mb-3">Click on the map to place a pin</p>
                <div className="flex gap-2">
                    <button onClick={() => { onSelect({ latitude: position[0], longitude: position[1] }); onClose(); }} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">
                        Share Location
                    </button>
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;