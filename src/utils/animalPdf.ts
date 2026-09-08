import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import type { CellHookData } from 'jspdf-autotable'
import type { Animal } from '../data/animal.js'

const GREEN  = [22, 163, 74]   as [number, number, number]
const RED    = [220, 38, 38]   as [number, number, number]
const AMBER  = [217, 119, 6]   as [number, number, number]
const SLATE  = [100, 116, 139] as [number, number, number]
const DARK   = [15, 23, 42]    as [number, number, number]
const LIGHT  = [248, 250, 252] as [number, number, number]

const PEN_OVERDUE_MS = 15 * 24 * 60 * 60 * 1000

function fmtDate(iso: string | undefined | null): string {
  if (!iso || iso === '—') return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function statusLabel(s: Animal['status']): string {
  return { actif: 'Actif', repos: 'Repos', alerte: 'Alerte', retraite: 'Retraite' }[s] ?? s
}

function vaccineStatusLabel(s: 'ok' | 'soon' | 'expired'): string {
  return { ok: 'À jour', soon: 'Bientôt', expired: 'Expiré' }[s]
}

export function exportAnimalsPdf(animals: Animal[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PAGE_W = 210
  const MARGIN = 14

  animals.forEach((a, idx) => {
    if (idx > 0) doc.addPage()

    /* ── Header band ── */
    doc.setFillColor(...DARK)
    doc.rect(0, 0, PAGE_W, 22, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${a.name}`, MARGIN, 13)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${a.species}  ·  ${a.id}`, MARGIN, 19)

    // Status pill (top-right)
    const statusColor = { actif: GREEN, repos: SLATE, alerte: RED, retraite: SLATE }[a.status] ?? SLATE
    doc.setFillColor(...statusColor)
    doc.roundedRect(PAGE_W - MARGIN - 28, 6, 28, 10, 3, 3, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(statusLabel(a.status), PAGE_W - MARGIN - 14, 12.5, { align: 'center' })

    let y = 30

    /* ── Section helper ── */
    const section = (title: string) => {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...SLATE)
      doc.text(title.toUpperCase(), MARGIN, y)
      doc.setDrawColor(...SLATE)
      doc.setLineWidth(0.2)
      doc.line(MARGIN + doc.getTextWidth(title.toUpperCase()) + 2, y - 0.5, PAGE_W - MARGIN, y - 0.5)
      y += 5
    }

    /* ── Identité ── */
    section('Identité')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 }, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: SLATE }, 1: { cellWidth: 'auto' } },
      body: [
        ['Genre',       a.gender ?? '—'],
        ['Date de naissance', fmtDate(a.birthDate)],
        ['Poids',       a.weight ?? '—'],
        ['N° puce',     a.chipId ?? '—'],
        ['Référent',    a.handler && a.handler !== '—' ? a.handler : '—'],
        ['Dernière séance', fmtDate(a.lastSession)],
      ],
    })
    y = (doc as any).lastAutoTable.finalY + 6

    /* ── Santé ── */
    section('Santé')

    const penOverdue = !!a.penMaintenance && (Date.now() - new Date(a.penMaintenance).getTime()) > PEN_OVERDUE_MS
    const penColor   = !a.penMaintenance ? SLATE : penOverdue ? RED : GREEN

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 }, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: SLATE }, 1: { cellWidth: 'auto' } },
      body: [
        ['Dernier contrôle vétérinaire', fmtDate(a.lastVetCheck)],
        ['Vermifuge',   a.antiparasiteOk ? '✓ Actif' : '⚠ Non renseigné'],
        ['Vermifuge (dernière date)', fmtDate(a.vermifugeLastDate)],
        ['Entretien du box', a.penMaintenance ? (penOverdue ? `⚠ ${fmtDate(a.penMaintenance)}` : `✓ ${fmtDate(a.penMaintenance)}`) : '—'],
      ],
      didDrawCell: (data) => {
        if (data.column.index === 1 && data.row.index === 3 && data.cell.section === 'body') {
          doc.setTextColor(...penColor)
        }
        if (data.column.index === 1 && data.row.index === 1 && data.cell.section === 'body') {
          doc.setTextColor(...(a.antiparasiteOk ? GREEN : AMBER))
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 6

    /* ── Vaccins ── */
    if (a.vaccines && a.vaccines.length > 0) {
      section('Vaccins')
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        theme: 'striped',
        headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: DARK },
        columns: [
          { header: 'Vaccin',  dataKey: 'name' },
          { header: 'Statut',  dataKey: 'status' },
          { header: 'Validité / date', dataKey: 'info' },
        ],
        body: a.vaccines.map(v => ({
          name:   v.name,
          status: vaccineStatusLabel(v.status),
          info:   fmtDate(v.info) || v.info || '—',
        })),
        didDrawCell: (data: CellHookData) => {
          if (data.column.dataKey === 'status' && data.cell.section === 'body') {
            const status = a.vaccines[data.row.index]?.status
            doc.setTextColor(...(status === 'ok' ? GREEN : status === 'soon' ? AMBER : RED))
          }
        },
      })
      y = (doc as any).lastAutoTable.finalY + 6
    }

    /* ── Structures ── */
    if (a.establishments && a.establishments.length > 0) {
      section('Structures')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(a.establishments.join('  ·  '), MARGIN, y, { maxWidth: PAGE_W - MARGIN * 2 })
      y += 8
    }

    /* ── Footer ── */
    doc.setFontSize(7)
    doc.setTextColor(...SLATE)
    doc.text(
      `AniMed · Fiche générée le ${new Date().toLocaleDateString('fr-FR')}`,
      PAGE_W / 2,
      290,
      { align: 'center' },
    )
  })

  doc.save(`animed-animaux-${new Date().toISOString().slice(0, 10)}.pdf`)
}
