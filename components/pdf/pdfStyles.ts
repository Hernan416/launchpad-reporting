import { StyleSheet } from "@react-pdf/renderer";

/** Brand colors, matching lib/accents.ts's light-mode values (a PDF has no dark mode). */
export const PDF_COLORS = {
  blue: "#0067eb",
  blueDark: "#003d78",
  gold: "#ffcf00",
  goldText: "#8a6d00",
  slate900: "#0f172a",
  slate500: "#64748b",
  slate200: "#e2e8f0",
  slate50: "#f8fafc",
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: PDF_COLORS.slate900,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.blueDark,
  },
  reportSubtitle: {
    fontSize: 11,
    color: PDF_COLORS.slate500,
    marginTop: 2,
  },
  generatedAt: {
    fontSize: 8,
    color: PDF_COLORS.slate500,
    textAlign: "right",
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.gold,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.blueDark,
    marginBottom: 8,
    marginTop: 16,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  card: {
    width: "23%",
    borderWidth: 1,
    borderColor: PDF_COLORS.slate200,
    borderTopWidth: 3,
    borderTopColor: PDF_COLORS.blue,
    borderRadius: 3,
    padding: 8,
  },
  cardGold: {
    borderTopColor: PDF_COLORS.gold,
  },
  cardLabel: {
    fontSize: 7.5,
    color: PDF_COLORS.slate500,
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.blueDark,
  },
  monthHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    backgroundColor: PDF_COLORS.blue,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 14,
    marginBottom: 0,
  },
  table: {
    borderWidth: 1,
    borderColor: PDF_COLORS.slate200,
    borderTopWidth: 0,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#eef4fe",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.slate200,
  },
  tableTotalRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: PDF_COLORS.blue,
    backgroundColor: PDF_COLORS.slate50,
  },
  tableCellHeader: {
    flex: 1,
    padding: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.blueDark,
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 8,
  },
  tableCellBold: {
    flex: 1,
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableCellFirst: {
    flex: 1.2,
    padding: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    right: 32,
    fontSize: 7.5,
    color: PDF_COLORS.slate500,
  },
});
