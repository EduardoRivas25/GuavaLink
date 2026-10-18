/* eslint-disable react-hooks/set-state-in-effect */
import { AdminGlyph, NavGlyph } from "@/components/dashboard-glyphs";
import { supabase } from "@/lib/supabase";
import { dashboardStyles } from "@/styles/dashboard";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";

type ReportRow = { date: string; values: string[] };
type ReportDefinition = {
  title: string;
  description: string;
  icon: "orchards" | "farmers" | "shipments" | "payments";
  headers: string[];
  rows: ReportRow[];
};

const pad = (value: number) => String(value).padStart(2, "0");
const localDate = () => {
  const value = new Date();
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};
const toDisplayDate = (value: string) => {
  const iso = String(value || "").slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value || "Sin fecha";
};
const parseInputDate = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const result = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return result.getFullYear() === Number(match[3]) &&
    result.getMonth() === Number(match[2]) - 1 &&
    result.getDate() === Number(match[1])
    ? result
    : null;
};
const parseRowDate = (value: string) => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return parseInputDate(value);
};
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const reportLogoAsset = require("../../assets/images/guavalink-logo.png");
const reportLogoUri =
  typeof reportLogoAsset === "string"
    ? reportLogoAsset
    : typeof reportLogoAsset?.uri === "string"
      ? reportLogoAsset.uri
      : typeof reportLogoAsset?.default === "string"
        ? reportLogoAsset.default
        : typeof reportLogoAsset?.default?.uri === "string"
          ? reportLogoAsset.default.uri
          : "";

export default function ReportsScreen({ compact }: { compact: boolean }) {
  const today = localDate();
  const [from, setFrom] = useState(`01/${today.slice(5, 7)}/${today.slice(0, 4)}`);
  const [to, setTo] = useState(toDisplayDate(today));
  const [rangeMessage, setRangeMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [receptions, setReceptions] = useState<any[]>([]);
  const [orchards, setOrchards] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [receptionsResult, orchardsResult, shipmentsResult, paymentsResult] =
        await Promise.all([
          supabase.from("receptions").select("*").order("created_at", { ascending: false }),
          supabase.from("orchards").select("*").order("created_at", { ascending: false }),
          supabase.from("shipments").select("*").order("created_at", { ascending: false }),
          supabase.from("payments").select("*").order("created_at", { ascending: false }),
        ]);
      const error =
        receptionsResult.error ||
        orchardsResult.error ||
        shipmentsResult.error ||
        paymentsResult.error;
      if (error) throw error;
      setReceptions(receptionsResult.data || []);
      setOrchards(orchardsResult.data || []);
      setShipments(shipmentsResult.data || []);
      setPayments(paymentsResult.data || []);
      setRangeMessage("");
    } catch (error: any) {
      setRangeMessage(error.message || "No fue posible cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const reports = useMemo<ReportDefinition[]>(() => {
    const orchardById = new Map(orchards.map((item) => [item.id, item]));
    return [
      {
        title: "Recepción de fruta",
        description: "Kilos, cajas y entregas por productor.",
        icon: "orchards",
        headers: ["Fecha", "Productor", "Huerta", "Cajas", "Kilos recibidos"],
        rows: receptions.map((item) => ({
          date: item.fecha || item.created_at || "",
          values: [
            toDisplayDate(item.fecha || item.created_at),
            item.producer_name || "Sin productor",
            item.orchard_name || "Sin huerta",
            String(item.boxes ?? item.cajas ?? 0),
            String(item.weight_kg ?? item.kilos ?? 0),
          ],
        })),
      },
      {
        title: "Producción por huerta",
        description: "Origen y volumen de cada recepción.",
        icon: "farmers",
        headers: ["Fecha", "Huerta", "Productor", "Hectáreas", "Kilos recibidos"],
        rows: receptions.map((item) => {
          const orchard = orchardById.get(item.orchard_id);
          return {
            date: item.fecha || item.created_at || "",
            values: [
              toDisplayDate(item.fecha || item.created_at),
              item.orchard_name || orchard?.name || "Sin huerta",
              item.producer_name || orchard?.producer || "Sin productor",
              String(orchard?.hectares ?? 0),
              String(item.weight_kg ?? item.kilos ?? 0),
            ],
          };
        }),
      },
      {
        title: "Embarques y destinos",
        description: "Kilos enviados, fechas y estado de cada embarque.",
        icon: "shipments",
        headers: ["Fecha", "Folio", "Destino", "Kilos", "Estado"],
        rows: shipments.map((item) => ({
          date: item.created_at || "",
          values: [
            item.departure || toDisplayDate(item.created_at),
            item.folio || "",
            item.destination || "",
            String(item.kilos || 0),
            item.status || "",
          ],
        })),
      },
      {
        title: "Pagos a productores",
        description: "Pagos realizados y saldos pendientes.",
        icon: "payments",
        headers: ["Fecha", "Productor", "Folio", "Huerta", "Monto (MXN)", "Estado"],
        rows: payments.map((item) => ({
          date: item.date || item.created_at || "",
          values: [
            toDisplayDate(item.date || item.created_at),
            item.producer_name || "Sin productor",
            item.folio || "",
            item.orchard || "Sin huerta",
            Number(item.amount || 0).toLocaleString("es-MX"),
            item.status || "Pendiente",
          ],
        })),
      },
    ];
  }, [orchards, payments, receptions, shipments]);

  const selectedRange = () => {
    const start = parseInputDate(from);
    const end = parseInputDate(to);
    if (!start || !end) {
      setRangeMessage("Usa el formato DD/MM/AAAA para las fechas.");
      return null;
    }
    end.setHours(23, 59, 59, 999);
    if (start > end) {
      setRangeMessage("La fecha inicial debe ser anterior a la fecha final.");
      return null;
    }
    setRangeMessage("");
    return { start, end };
  };

  const filteredRows = (report: ReportDefinition) => {
    const range = selectedRange();
    if (!range) return null;
    return report.rows.filter((row) => {
      const date = parseRowDate(row.date);
      return date && date >= range.start && date <= range.end;
    });
  };

  const reportHtml = (selectedReports: ReportDefinition[]) => {
    const sections = selectedReports
      .map((report) => {
        const rows = filteredRows(report);
        if (!rows) return "";
        const body = rows.length
          ? rows
              .map(
                (row) =>
                  `<tr>${row.values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`,
              )
              .join("")
          : `<tr><td colspan="${report.headers.length}">Sin registros en este periodo</td></tr>`;
        return `<section><h2>${escapeHtml(report.title)}</h2><p>${escapeHtml(report.description)}</p><table><thead><tr>${report.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></section>`;
      })
      .join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>Reporte GuavaLink</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:36px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #16a34a;padding-bottom:18px;margin-bottom:28px}img{width:190px;max-height:70px;object-fit:contain}h1{font-size:22px;margin:0}h2{color:#166534;margin:28px 0 6px}p{color:#64748b;margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#166534;color:#fff;text-align:left}th,td{padding:9px;border:1px solid #dbe2ea}tr:nth-child(even){background:#f6faf7}.period{font-size:12px;color:#64748b;text-align:right}@media print{body{margin:18px}section{break-inside:avoid}}</style></head><body><header>${reportLogoUri ? `<img src="${escapeHtml(reportLogoUri)}" alt="GuavaLink">` : "<strong>GuavaLink</strong>"}<div><h1>Reporte operativo</h1><div class="period">Periodo: ${escapeHtml(from)} — ${escapeHtml(to)}</div></div></header>${sections}<script>setTimeout(()=>window.print(),400)</script></body></html>`;
  };

  const openReport = async (selectedReports: ReportDefinition[]) => {
    const html = reportHtml(selectedReports);
    if (!html.includes("<section>")) return;
    if (Platform.OS === "web") {
      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        setRangeMessage("Permite ventanas emergentes para abrir el reporte.");
        return;
      }
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      return;
    }
    await Share.share({ title: "Reporte GuavaLink", message: html });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        dashboardStyles.producerContent,
        compact && dashboardStyles.contentCompact,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          dashboardStyles.producerHeading,
          compact && dashboardStyles.producerHeadingCompact,
        ]}
      >
        <View style={dashboardStyles.welcomeCopy}>
          <Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text>
          <Text
            style={[
              dashboardStyles.producerTitle,
              compact && dashboardStyles.producerTitleCompact,
            ]}
          >
            Reportes
          </Text>
          <Text style={dashboardStyles.subtitle}>
            Información real de la operación, lista para imprimir o guardar en PDF.
          </Text>
        </View>
        {!compact && (
          <Pressable
            style={dashboardStyles.exportButton}
            onPress={() => void openReport(reports)}
          >
            <AdminGlyph name="download" />
            <Text style={dashboardStyles.exportText}>Generar reporte general</Text>
          </Pressable>
        )}
      </View>
      {rangeMessage ? (
        <Text accessibilityRole="alert" style={dashboardStyles.reportError}>
          {rangeMessage}
        </Text>
      ) : null}
      {loading ? <ActivityIndicator color="#0071e3" size="large" /> : null}
      <View
        style={[
          dashboardStyles.reportGrid,
          compact && dashboardStyles.reportGridCompact,
        ]}
      >
        {reports.map((report) => (
          <View
            key={report.title}
            style={[
              dashboardStyles.reportCard,
              compact && dashboardStyles.reportCardCompact,
            ]}
          >
            <View style={dashboardStyles.reportIcon}>
              <NavGlyph name={report.icon} active />
            </View>
            <Text style={dashboardStyles.reportTitle}>{report.title}</Text>
            <Text style={dashboardStyles.reportDescription}>
              {report.description} {report.rows.length} registros disponibles.
            </Text>
            <View
              style={[
                dashboardStyles.reportDates,
                compact && dashboardStyles.reportDatesCompact,
              ]}
            >
              <TextInput
                value={from}
                onChangeText={(value) => {
                  setFrom(value);
                  setRangeMessage("");
                }}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#86868b"
                accessibilityLabel={`Fecha inicial para ${report.title}`}
                style={[
                  dashboardStyles.reportDateInput,
                  compact && dashboardStyles.reportDateInputCompact,
                ]}
              />
              <Text style={dashboardStyles.reportDash}>—</Text>
              <TextInput
                value={to}
                onChangeText={(value) => {
                  setTo(value);
                  setRangeMessage("");
                }}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#86868b"
                accessibilityLabel={`Fecha final para ${report.title}`}
                style={[
                  dashboardStyles.reportDateInput,
                  compact && dashboardStyles.reportDateInputCompact,
                ]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void openReport([report])}
              style={dashboardStyles.reportDownload}
            >
              <AdminGlyph name="download" />
              <Text style={dashboardStyles.reportDownloadText}>
                Generar reporte
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      {compact ? (
        <Pressable
          style={dashboardStyles.exportButton}
          onPress={() => void openReport(reports)}
        >
          <AdminGlyph name="download" />
          <Text style={dashboardStyles.exportText}>Generar reporte general</Text>
        </Pressable>
      ) : null}
      <Text style={dashboardStyles.reportFootnote}>
        Los reportes usan únicamente registros actuales de Supabase e incluyen el logo de GuavaLink.
      </Text>
    </ScrollView>
  );
}
