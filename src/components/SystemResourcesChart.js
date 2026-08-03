import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Validated against dark surface #141a22 — see dataviz skill's validate_palette.js
const SERIES_COLOR = { cpu: '#3987e5', mem: '#d95926', disk: '#199e70' };
const CHART_INK = { grid: '#2c3944', axis: '#8592a0', tooltipBg: '#1e2731', tooltipBorder: '#2c3944' };

// This whole component (not its individual pieces) must be the thing loaded
// via next/dynamic({ ssr: false }) in the page. Recharts' LineChart inspects
// its children's component identity to tell Line/XAxis/etc. apart — wrapping
// each of those subcomponents in its own separate dynamic() boundary (the
// original implementation) makes LineChart fail to recognize them as its own
// children, so the chart silently renders nothing. Keeping all the recharts
// imports static here, and only lazy-loading this single component from the
// page, avoids that while still skipping SSR (recharts needs a real DOM).
export default function SystemResourcesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="85%">
      <LineChart data={data}>
        <CartesianGrid stroke={CHART_INK.grid} strokeDasharray="3 3" />
        <XAxis dataKey="time" stroke={CHART_INK.axis} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
        <YAxis stroke={CHART_INK.axis} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: CHART_INK.tooltipBg, border: `1px solid ${CHART_INK.tooltipBorder}`, borderRadius: 4, fontSize: 12 }}
          labelStyle={{ color: '#e9e6dc' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK.axis }} />
        <Line type="monotone" dataKey="cpu" stroke={SERIES_COLOR.cpu} strokeWidth={2} dot={false} name="CPU load" />
        <Line type="monotone" dataKey="mem" stroke={SERIES_COLOR.mem} strokeWidth={2} dot={false} name="Mem used %" />
        <Line type="monotone" dataKey="disk" stroke={SERIES_COLOR.disk} strokeWidth={2} dot={false} name="Disk used %" />
      </LineChart>
    </ResponsiveContainer>
  );
}
