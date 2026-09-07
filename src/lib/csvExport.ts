/**
 * Utility to export interview schedules to CSV format for Google Sheets / Excel
 */

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadInterviewsCsv(
  interviews: any[], 
  dateFilter: string = "", 
  panelFilter: string = "ALL"
) {
  if (!interviews || interviews.length === 0) {
    alert("No interview records to export.");
    return;
  }

  const headers = [
    "Interview ID",
    "Date (IST)",
    "Time (IST)",
    "Round",
    "Candidate Name",
    "Registration Number",
    "Department",
    "Candidate Email",
    "Candidate Phone",
    "Panel Name",
    "Assigned Panelists",
    "Status",
    "Meeting Link",
    "Portfolio / Resume Link"
  ];

  const rows = interviews.map((inv) => {
    const dateStr = new Date(inv.date).toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const startTime = new Date(inv.start_time).toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit"
    });

    const endTime = new Date(inv.end_time).toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit"
    });

    const timeSlot = `${startTime} - ${endTime}`;

    const panelists = (inv.assigned_members && inv.assigned_members.length > 0)
      ? inv.assigned_members.map((m: any) => m.user?.name).filter(Boolean).join(", ")
      : (inv.panel?.members ? inv.panel.members.map((m: any) => m.user?.name).filter(Boolean).join(", ") : "");

    return [
      escapeCsv(inv.id),
      escapeCsv(dateStr),
      escapeCsv(timeSlot),
      escapeCsv(`Round ${inv.round}`),
      escapeCsv(inv.application?.name || "N/A"),
      escapeCsv(inv.application?.registerNumber || "N/A"),
      escapeCsv(inv.application?.domain || "N/A"),
      escapeCsv(inv.application?.email || "N/A"),
      escapeCsv(inv.application?.phoneNumber || "N/A"),
      escapeCsv(inv.panel?.name || "N/A"),
      escapeCsv(panelists || "N/A"),
      escapeCsv(inv.status),
      escapeCsv(inv.meeting_link || ""),
      escapeCsv(inv.application?.portfolio || "")
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);

  const cleanDate = dateFilter || "all-dates";
  const cleanPanel = panelFilter && panelFilter !== "ALL" ? panelFilter.replace(/\s+/g, "-").toLowerCase() : "all-panels";
  link.setAttribute("download", `interviews-${cleanDate}-${cleanPanel}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
