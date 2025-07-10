-- =====================================================
-- QUERIES SQL PARA ATHENA - PROYECTO FINAL CS2032
-- Evidencia de 3 queries SQL requeridas en el proyecto
-- =====================================================

-- Query 1: Análisis de ventas por tenant
-- Muestra el total de compras y ventas por cada tenant
SELECT 
    tenant_id,
    COUNT(*) as total_compras,
    ROUND(SUM(CAST(total_amount AS DOUBLE)), 2) as total_ventas,
    ROUND(AVG(CAST(total_amount AS DOUBLE)), 2) as promedio_compra,
    MIN(CAST(total_amount AS DOUBLE)) as compra_minima,
    MAX(CAST(total_amount AS DOUBLE)) as compra_maxima
FROM compras_database.compras_table 
WHERE year = '2025' 
GROUP BY tenant_id
ORDER BY total_ventas DESC;

-- Query 2: Análisis temporal - Ventas por día
-- Permite ver la evolución de ventas día a día por tenant
SELECT 
    tenant_id,
    CONCAT(year, '-', 
           LPAD(month, 2, '0'), '-', 
           LPAD(day, 2, '0')) as fecha,
    COUNT(*) as compras_del_dia,
    ROUND(SUM(CAST(total_amount AS DOUBLE)), 2) as ventas_del_dia,
    ROUND(AVG(CAST(total_amount AS DOUBLE)), 2) as ticket_promedio,
    COUNT(DISTINCT user_email) as usuarios_unicos_dia
FROM compras_database.compras_table 
WHERE year = '2025' 
    AND month = '07'  -- Mes actual
GROUP BY tenant_id, year, month, day
ORDER BY tenant_id, fecha DESC;

-- Query 3: Análisis de usuarios más activos
-- Identifica los usuarios que más compran por tenant
SELECT 
    tenant_id,
    user_email,
    COUNT(*) as total_compras_usuario,
    ROUND(SUM(CAST(total_amount AS DOUBLE)), 2) as total_gastado,
    ROUND(AVG(CAST(total_amount AS DOUBLE)), 2) as gasto_promedio_usuario,
    MIN(created_at) as primera_compra,
    MAX(created_at) as ultima_compra
FROM compras_database.compras_table
WHERE year = '2025'
GROUP BY tenant_id, user_email
HAVING COUNT(*) >= 1  -- Al menos una compra
ORDER BY tenant_id, total_gastado DESC
LIMIT 20;

-- =====================================================
-- QUERIES ADICIONALES PARA DEMOSTRAR CAPACIDADES
-- =====================================================

-- Query 4: Resumen ejecutivo por partición
SELECT 
    tenant_id,
    year,
    month,
    COUNT(*) as compras_mes,
    ROUND(SUM(CAST(total_amount AS DOUBLE)), 2) as ventas_mes,
    COUNT(DISTINCT user_email) as usuarios_activos_mes,
    COUNT(DISTINCT day) as dias_con_ventas
FROM compras_database.compras_table
WHERE year = '2025'
GROUP BY tenant_id, year, month
ORDER BY tenant_id, year DESC, month DESC;

-- Query 5: Análisis de patrones de compra por hora
SELECT 
    tenant_id,
    HOUR(CAST(created_at AS TIMESTAMP)) as hora_compra,
    COUNT(*) as compras_por_hora,
    ROUND(AVG(CAST(total_amount AS DOUBLE)), 2) as ticket_promedio_hora
FROM compras_database.compras_table
WHERE year = '2025' 
    AND month = '07'
    AND created_at IS NOT NULL
GROUP BY tenant_id, HOUR(CAST(created_at AS TIMESTAMP))
ORDER BY tenant_id, hora_compra;