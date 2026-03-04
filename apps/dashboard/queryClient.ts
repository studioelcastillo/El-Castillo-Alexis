import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita recargas innecesarias al cambiar de pestaña
      retry: 3, // Reintenta 3 veces si falla la conexión
      staleTime: 1000 * 60 * 5, // Considera los datos frescos por 5 minutos
    },
  },
});
