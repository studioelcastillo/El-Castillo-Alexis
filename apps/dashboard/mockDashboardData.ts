export const MOCK_DASHBOARD_DATA = {
  indicators: {
    earnings: {
      cop: 15420000,
      usd: 3850.50,
      eur: 120.00
    },
    trm: {
      usd: 4005.20,
      eur: 4350.10
    },
    studios: 5,
    models: 42,
    rooms: {
      total: 20,
      occupied: 15
    },
    birthdays: [
      { mod_artistic_name: 'Luna Star', mod_birthday: '1998-12-15' },
      { mod_artistic_name: 'Bella Rose', mod_birthday: '2000-12-20' }
    ],
    top_models: [
      { mod_artistic_name: 'Luna Star', std_name: 'Studio A', total_usd: 1200.50 },
      { mod_artistic_name: 'Bella Rose', std_name: 'Studio B', total_usd: 950.00 },
      { mod_artistic_name: 'Mia Khalifa', std_name: 'Studio A', total_usd: 800.25 },
      { mod_artistic_name: 'Sasha Grey', std_name: 'Studio C', total_usd: 750.00 },
      { mod_artistic_name: 'Riley Reid', std_name: 'Studio B', total_usd: 600.00 }
    ]
  },
  tasks: {
    missing_bank_info: [
      { mod_artistic_name: 'Nueva Modelo 1' }
    ],
    missing_documents: [
      { mod_artistic_name: 'Modelo Sin Cedula', missing: ['Cédula', 'RUT'] }
    ],
    pending_petitions: [
      { mod_artistic_name: 'Luna Star', pet_type: 'Adelanto de Nómina' }
    ],
    birthdays_today: [
      { mod_artistic_name: 'Cumpleañera Hoy' }
    ]
  },
  charts: {
    earnings_by_platform: {
      categories: ['Chaturbate', 'Stripchat', 'BongaCams', 'LiveJasmin', 'StreamMate'],
      series: [
        {
          name: 'Ingresos',
          data: [5000, 3500, 2800, 1500, 1200]
        }
      ]
    },
    model_goals: [
      { mod_id: 1, mod_artistic_name: 'Luna Star', goal_usd: 2000, current_usd: 1200.50, percentage: 60 },
      { mod_id: 2, mod_artistic_name: 'Bella Rose', goal_usd: 1500, current_usd: 950.00, percentage: 63 },
      { mod_id: 3, mod_artistic_name: 'Mia Khalifa', goal_usd: 1800, current_usd: 800.25, percentage: 44 },
      { mod_id: 4, mod_artistic_name: 'Sasha Grey', goal_usd: 1200, current_usd: 750.00, percentage: 62 },
      { mod_id: 5, mod_artistic_name: 'Riley Reid', goal_usd: 1000, current_usd: 600.00, percentage: 60 }
    ]
  }
};
