import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { CERTIFICATE_STATEMENT, competencySource, type CertificateSnapshot } from "@/lib/certificate/eligibility";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 11, color: "#1b2428", lineHeight: 1.5 },
  frame: { borderWidth: 3, borderColor: "#0b5d6b", padding: 36, flexGrow: 1 },
  title: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#0b5d6b", textAlign: "center", marginBottom: 18 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "center", marginVertical: 8 },
  center: { textAlign: "center" },
  h: { fontFamily: "Helvetica-Bold", marginTop: 14 },
  statement: { marginTop: 22, fontFamily: "Helvetica-Bold", textAlign: "center" },
  small: { fontSize: 9, color: "#4a585e", textAlign: "center", marginTop: 6 },
});

export async function certificatePdf(s: CertificateSnapshot, id: string, verifyUrl: string): Promise<Buffer> {
  const d = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return renderToBuffer(
    <Document title={`Certificate of Completion – ${s.name}`} author="Career Switch Portal">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.center}>This is to confirm that</Text>
          <Text style={styles.name}>{s.name}</Text>
          <Text style={styles.center}>has completed the {s.pathway} pathway on Career Switch Portal.</Text>
          <Text style={styles.h}>Modules completed</Text>
          <Text>{s.modules.join(" · ")}</Text>
          <Text style={styles.h}>Assessments passed</Text>
          {s.assessments.map((a) => (
            <Text key={a.title}>
              {a.title} – {d(a.passedAt)}
            </Text>
          ))}
          {s.competencies.length ? <Text style={styles.h}>Practical assignments (simulated projects) that met the course standard</Text> : null}
          {s.competencies.map((c) => (
            <Text key={c.title}>
              {c.title} – {d(c.demonstratedAt)} ({competencySource(c.assessedBy)})
            </Text>
          ))}
          <Text style={styles.statement}>{CERTIFICATE_STATEMENT}</Text>
          <Text style={styles.small}>
            Issued {d(s.issuedAt)} · Verification ID {id} · Check it at {verifyUrl}
          </Text>
        </View>
      </Page>
    </Document>,
  );
}
