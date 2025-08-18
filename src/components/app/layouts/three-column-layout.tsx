
import { cn } from "@/lib/utils";

const ThreeColumnLayout = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-4 md:p-6 lg:p-8", className)}>
      {children}
    </div>
  );
};

const Left = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("lg:col-span-4 h-full flex flex-col gap-6 transition-all duration-300", className)}>{children}</div>;
};

const Main = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("lg:col-span-5 h-full flex flex-col gap-6 transition-all duration-300", className)}>{children}</div>;
};

const Right = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("lg:col-span-3 h-full flex flex-col gap-6", className)}>{children}</div>;
};

ThreeColumnLayout.Left = Left;
ThreeColumnLayout.Main = Main;
ThreeColumnLayout.Right = Right;

export { ThreeColumnLayout };
