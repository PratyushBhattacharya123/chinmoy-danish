"use client";

import React, { useState } from "react";
import {
  Button,
  Text,
  Box,
  Group,
  Stack,
  Center,
  ThemeIcon,
  rem,
  Loader,
} from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

const LogoutModalContent = ({ context, id }: ContextModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      });

      context.closeModal(id);

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out, try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box px="lg" py="md" style={{ maxWidth: rem(400) }}>
      <Stack gap="md">
        <Center>
          <ThemeIcon color="gray" size="xl" radius="xl" variant="light">
            {isLoading ? (
              <Loader size="sm" color="gray" />
            ) : (
              <LogOutIcon size={28} className="text-gray-600" />
            )}
          </ThemeIcon>
        </Center>

        <Text fw={600} fz="lg" className="text-center text-gray-700">
          {isLoading ? "Logging out..." : "Log out of your account?"}
        </Text>
        <Text fz="sm" c="dimmed" className="text-center">
          Are you sure you want to log out? You&apos;ll need to log in again to
          access your dashboard.
        </Text>

        <Group justify="center" mt="sm">
          <Button
            variant="outline"
            color="gray"
            onClick={() => context.closeModal(id)}
            radius="md"
            disabled={isLoading}
            className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            color="gray"
            onClick={handleSubmit}
            radius="md"
            style={{ minWidth: rem(100) }}
            loading={isLoading}
            disabled={isLoading}
            className="!bg-gray-700 hover:!bg-gray-800 !text-white"
          >
            Logout
          </Button>
        </Group>
      </Stack>
    </Box>
  );
};

export default LogoutModalContent;
