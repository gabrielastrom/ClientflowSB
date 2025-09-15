import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-foreground">
            <Logo />
            <span className="font-bold">FLOW1 v1.2</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BrandGuys
          </p>
          <p className="text-sm text-muted-foreground">
            How's my favorite branch doing?
          </p>
          <div className="flex items-center gap-x-6 py-12 sm:py-6">
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
