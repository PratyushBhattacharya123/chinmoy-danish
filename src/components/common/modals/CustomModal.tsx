import { useIsMobile } from "@/hooks/use-mobile";
import { Modal } from "@mantine/core";

interface CustomModalProps {
  title: string;
  component: React.ElementType;
  opened: boolean;
  onClose: () => void;
  id?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  title,
  component: Component,
  opened,
  onClose,
  id,
}) => {
  const isMobile = useIsMobile();

  return (
    <Modal
      size={isMobile ? "xs" : "md"}
      opened={opened}
      centered
      onClose={onClose}
      title={<div className="font-semibold text-lg text-gray-700">{title}</div>}
      zIndex={100}
      styles={{
        header: {
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e2e8f0",
          padding: "1rem 1.5rem",
        },
        content: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          maxWidth: "600px",
        },
      }}
    >
      <Component onClose={onClose} id={id} />
    </Modal>
  );
};

export default CustomModal;
