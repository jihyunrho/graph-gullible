import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Scenario, ChartType } from '../types';

interface GraphDisplayProps {
  scenario: Scenario;
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ scenario }) => {
  const { chartType, data, chartConfig } = scenario;

  // Default labels if not provided
  const label1 = chartConfig.seriesNames?.value || "Value";
  const label2 = chartConfig.seriesNames?.value2 || "Comparison";

  const CommonAxis = () => (
    <>
      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
      {!chartConfig.hideYAxis && (
        <YAxis 
          domain={chartConfig.yAxisDomain} 
          reversed={chartConfig.reversedYAxis}
          stroke="#6b7280" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={chartConfig.customTickFormatter}
        />
      )}
      {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />}
      <Tooltip 
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        cursor={{ fill: '#f3f4f6' }}
      />
      <Legend />
    </>
  );

  const renderChart = () => {
    switch (chartType) {
      case ChartType.BAR:
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CommonAxis />
            <Bar 
              dataKey="value" 
              name={label1} 
              fill={chartConfig.colors[0]} 
              radius={[4, 4, 0, 0]} 
              animationDuration={1500} 
            />
          </BarChart>
        );
      case ChartType.LINE:
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CommonAxis />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={label1}
              stroke={chartConfig.colors[0]} 
              strokeWidth={3} 
              dot={{ r: 6, fill: chartConfig.colors[0], strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1500}
            />
             {/* Support for potential second line */}
             {data[0].value2 !== undefined && (
                 <Line 
                 type="monotone" 
                 dataKey="value2"
                 name={label2}
                 stroke={chartConfig.colors[1] || '#000'} 
                 strokeWidth={3} 
                 dot={{ r: 6, fill: chartConfig.colors[1], strokeWidth: 2, stroke: '#fff' }}
                 animationDuration={1500}
               />
             )}
          </LineChart>
        );
      case ChartType.AREA:
        return (
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CommonAxis />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  name={label1}
                  stroke={chartConfig.colors[0]} 
                  fill={chartConfig.colors[0]} 
                  fillOpacity={0.3} 
                  animationDuration={1500} 
                />
            </AreaChart>
        );
      case ChartType.PIE:
        return (
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig.colors[index % chartConfig.colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{scenario.title}</h2>
        <p className="text-gray-500 mt-2 text-sm">{scenario.description}</p>
      </div>
      <div className="w-full h-[300px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div>Chart Error</div>}
        </ResponsiveContainer>
      </div>
      <div className="mt-6 text-xs text-gray-400 italic bg-gray-50 px-3 py-1 rounded-full">
        Figure {scenario.id}: Source - "TrustMe Bro Analytics"
      </div>
    </div>
  );
};

export default GraphDisplay;