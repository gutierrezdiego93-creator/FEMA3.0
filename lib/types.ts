// lib/types.ts
// Tipos de datos que devuelve Fracttal para tareas pendientes

export interface FracttalTask {
  id: number;
  code: string;
  item_description: string;       // Nombre del activo
  task_description?: string;      // Nombre de la tarea
  description?: string;
  date_maintenance: string;       // Fecha programada
  duration: number;               // Duración en minutos
  delay: number;                  // Días de atraso (0 = a tiempo)
  id_priorities: number;          // 1=Muy Alta, 2=Alta, 3=Media, 4=Baja, 5=Muy Baja
  wo_folio?: string;              // Número de OT si ya tiene
  id_group_task?: number;         // Si es planificada o no
  location_description?: string;  // Ubicación
  workshop_description?: string;  // Taller
  type_description?: string;      // Tipo (Preventivo, Correctivo, etc.)
  discipline_description?: string;// Disciplina (Eléctrico, Mecánico, etc.)
  requested_by?: string;
  [key: string]: unknown;
}

export interface FracttalApiResponse {
  success: boolean;
  data: FracttalTask[];
  total: number;
}

export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export const PRIORITY_LABELS: Record<number, string> = {
  1: "MUY ALTA",
  2: "ALTA",
  3: "MEDIA",
  4: "BAJA",
  5: "MUY BAJA",
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#94a3b8",
};
