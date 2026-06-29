"use client";

import { useState, useEffect, useCallback } from "react";
import { FracttalTask } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import TaskDetail from "@/components/TaskDetail";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<FracttalTask[]>([]);
  const [filtered, setFiltered] = useState<FracttalTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<FracttalTask | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const taskList: FracttalTask[] = data.data || data || [];
      // Ordenar por id descendente: la tarea más nueva arriba
      taskList.sort((a, b) => b.id - a.id);
      setTasks(taskList);
      setFiltered(taskList);
      setLastUpdated(new Date());
    } catch (err) {
      setError("No se pudieron cargar las tareas. Verifica la conexión con Fracttal.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => fetchTasks(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(tasks);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      tasks.filter(
        (t) =>
          t.item_description?.toLowerCase().includes(q) ||
          t.task_description?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q) ||
          t.location_description?.toLowerCase().includes(q)
      )
    );
  }, [search, tasks]);

  const overdueCount = tasks.filter((t) => t.delay > 0).length;
  const plannedCount = tasks.filter((t) => !!t.id_group_task).length;
  const unplannedCount = tasks.filter((t) => !t.id_group_task).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9" }}>
      {/* HEADER */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div
