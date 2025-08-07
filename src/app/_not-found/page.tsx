export const dynamic = "force-dynamic"; // 🔐 förhindra att den prerenderas

export default function NotFoundPage() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem" }}>404 – Page Not Found</h1>
      <p>Sorry, we couldn't find the page you were looking for.</p>
    </div>
  );
}
