"use client";

// Último recurso: erro no layout raiz. Sem i18n (o provider pode ter falhado).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf7f2", color: "#1b1f2a", margin: 0 }}>
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "20vh 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 20 }}>Algo saiu do previsto / Something went wrong</h1>
          <p style={{ color: "#5d6573", fontSize: 14 }}>
            Seus dados estão seguros. Tente de novo em instantes. / Your data is safe. Please try again shortly.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#1e2a4a", color: "#fff", fontSize: 14 }}
          >
            Tentar de novo / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
