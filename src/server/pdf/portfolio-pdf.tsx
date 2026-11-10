import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { PortfolioView } from "../portfolio";
import { PORTFOLIO_LABEL } from "@/lib/portfolio/format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", lineHeight: 1.4, color: "#1b2428" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  banner: { backgroundColor: "#fff4dc", padding: 8, marginVertical: 10, fontFamily: "Helvetica-Bold" },
  item: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#cfd8d8" },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  label: { fontSize: 9, color: "#7a4a00", marginTop: 2, fontFamily: "Helvetica-Bold" },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 6 },
  muted: { color: "#4a585e" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#4a585e", textAlign: "center" },
});

export async function portfolioPdf(name: string, items: PortfolioView[]): Promise<Buffer> {
  const doc = (
    <Document title={`Portfolio – ${name}`} author="Career Switch Portal">
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Portfolio: {name}</Text>
        <Text style={styles.muted}>Produced on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} by Career Switch Portal.</Text>
        <Text style={styles.banner}>Every item in this portfolio is a {PORTFOLIO_LABEL.toLowerCase()}. ShopEasy is a fictional company.</Text>
        {items.length === 0 ? <Text>No items yet.</Text> : null}
        {items.map((i) => (
          <View key={i.id} style={styles.item} wrap>
            <Text style={styles.h2}>{i.title}</Text>
            <Text style={styles.label}>{PORTFOLIO_LABEL}</Text>
            {i.competency ? <Text style={styles.muted}>{i.competency}</Text> : null}
            {i.sections.map((s, n) => (
              <View key={n}>
                <Text style={styles.h3}>{s.heading}</Text>
                {s.lines.map((l, m) => (
                  <Text key={m}>{l}</Text>
                ))}
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${PORTFOLIO_LABEL} · Page ${pageNumber} of ${totalPages}`} />
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
