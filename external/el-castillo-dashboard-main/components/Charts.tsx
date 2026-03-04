
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartsProps {
  data: any;
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  if (!data) return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-80 flex items-center justify-center text-slate-400 italic">
        Cargando gráficos...
    </div>
  );

  // Transformar datos de series de la API al formato Recharts
  const chartData = data.categories.map((cat: string, index: number) => {
    const obj: any = { name: cat };
    data.series.forEach((serie: any) => {
      obj[serie.name] = serie.data[index];
    });
    return obj;
  });

  const colors = ['#f59e0b', '#334155', '#6366f1', '#10b981', '#f43f5e'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-lg font-bold text-slate-900">Ganancias x Plataforma</h3>
            <p className="text-sm text-slate-500 mt-1">Comparativa de ingresos en el periodo</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                dy={14}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 11}}
                tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                }}
            />
            {data.series.map((serie: any, idx: number) => (
                <Bar 
                    key={serie.name} 
                    dataKey={serie.name} 
                    stackId="a" 
                    fill={colors[idx % colors.length]} 
                    radius={idx === data.series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} 
                />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
