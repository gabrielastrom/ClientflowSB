export const ADMIN_EMAILS = ["gabriel@brandguys.se", "simon@brandguys.se"];
export const isAdmin = (email: string | null | undefined) => email && ADMIN_EMAILS.includes(email);