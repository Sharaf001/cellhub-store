export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6">
      <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} CellHub. Built by @mm.webstudio. All rights reserved.
      </div>
    </footer>
  );
}
