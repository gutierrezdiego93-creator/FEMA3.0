// lib/types.ts

export interface FracttalTask {
  id: number;
  code: string;
  item_description: string;
  task_description?: string;
  description?: string;
  date_maintenance: string;
  duration: number;
  delay: number;
  id_priorities: number;
  wo_folio?: string;
  id_group_task?: number;
  location_description?: string;
  workshop_description?: string;
  type_description?: string;
  tasks_types_main_description?: string;
  tasks_types_description?: string;
  tasks_types_2_description?: string;
  priorities_description?: string;
  group_task_description?: string;
  requested_by?: string;
  trigger_description?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface FracttalApiResponse {
  success: boolean;
  data: FracttalTask[];
  total: number;
}

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

// ====== Tipos para OTs en Proceso (Etapa 2) ======
export interface FracttalWorkOrder {
  id_work_order: number;
  wo_folio: string;
  items_log_description: string;
  description: string;
  completed_percentage: number;
  date_maintenance: string;
  personnel_description: string;
  code_responsible: string;
  has_children: boolean;
  id_parent_wo: string | null;
  duration: number;
  created_by: string;
  [key: string]: string | number | boolean | null | undefined;
}
