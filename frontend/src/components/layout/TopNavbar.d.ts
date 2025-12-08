type NavLinkItem = {
    label: string;
    to?: string;
    onClick?: () => void;
    isActive?: boolean;
    variant?: "default" | "danger";
};
interface TopNavbarProps {
    primaryAction?: {
        label: string;
        to: string;
    };
    secondaryAction?: {
        label: string;
        to: string;
    };
    showAuthCTA?: boolean;
    className?: string;
    navLinks?: Array<NavLinkItem>;
}
export default function TopNavbar({ primaryAction, secondaryAction, showAuthCTA, className, navLinks }: TopNavbarProps): import("react/jsx-runtime").JSX.Element;
export {};
