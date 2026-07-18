import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';

export const Menu = ({ size = 24, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Share = ({ size = 22, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Calendar = ({ size = 16, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronDown = ({ size = 16, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRight = ({ size = 16, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronLeft = ({ size = 16, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowUp = ({ size = 14, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="19" x2="12" y2="5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="5 12 12 5 19 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowDown = ({ size = 14, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="19 12 12 19 5 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Plus = ({ size = 18, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Trash = ({ size = 18, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Search = ({ size = 18, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Heartbeat = ({ size = 20, color = "#3d2e3c" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Tab Icons
export const IconHome = ({ size = 24, active = false, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#3d2e3c" : "none"}>
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={active ? "#3d2e3c" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="9 22 9 12 15 12 15 22" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconExpenses = ({ size = 24, active = false, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#3d2e3c" : "none"}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={active ? "#3d2e3c" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={active ? "#3d2e3c" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="10 9 9 9 8 9" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconBudget = ({ size = 24, active = false, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#3d2e3c" : "none"}>
    <Rect x="2" y="4" width="20" height="16" rx="2" ry="2" stroke={active ? "#3d2e3c" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="4" x2="12" y2="20" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={active ? "#fff" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7" cy="15" r="2" stroke={active ? "#fff" : color} strokeWidth="2" />
    <Circle cx="17" cy="15" r="2" stroke={active ? "#fff" : color} strokeWidth="2" />
  </Svg>
);

export const IconAnalytics = ({ size = 24, active = false, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#3d2e3c" : "none"}>
    <Line x1="18" y1="20" x2="18" y2="10" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12" y2="4" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="20" x2="6" y2="14" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconMore = ({ size = 24, active = false, color = "#b0aab0" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#3d2e3c" : "none"}>
    <Circle cx="12" cy="12" r="1" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" />
    <Circle cx="19" cy="12" r="1" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" />
    <Circle cx="5" cy="12" r="1" stroke={active ? "#3d2e3c" : color} strokeWidth="2.5" />
  </Svg>
);

// Extra Category Icons for Smart Trends
export const IconCar = ({ size = 18, color = "#3d2e3c" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="3" width="15" height="13" rx="2" ry="2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
  </Svg>
);

export const IconPiggy = ({ size = 18, color = "#34a853" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 5c-1.5 0-2.8 1.4-3 2-1-.7-2.5-1-4-1-3.9 0-7 2.7-7 6 0 2.2 1.4 4.3 3.6 5.3L7 21h3l1.3-2.6c.9.4 1.8.6 2.7.6 3.9 0 7-2.7 7-6V9c0-2-1-4-3-4z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 11h.01" stroke={color} strokeWidth="2.2" />
  </Svg>
);

export const IconCard = ({ size = 18, color = "#ea4335" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="2.2" />
  </Svg>
);

export const Gear = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const UserCircle = ({ size = 24, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={color} strokeWidth="2" />
    <Path d="M17.67 19a7.5 7.5 0 0 0-11.34 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const ShieldCheck = ({ size = 20, color = "#3d2e3c" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="9 11 11 13 15 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Headphones = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Crown = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 20h18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Users = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const Gift = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 12 20 22 4 22 4 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="2" y="7" width="20" height="5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="22" x2="12" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const StarOutline = ({ size = 20, color = "#1f1a1f" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
