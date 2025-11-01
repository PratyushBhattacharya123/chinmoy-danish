"use client";

import { UpdateUser, updateUserSchema } from "@/@types";
import { UserDataType } from "@/app/admin/users/page";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, Select } from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const EditUserModalContent = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{ data: UserDataType; id: string }>) => {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
  });

  const [userType, setUserType] = useState<"USER" | "OPERATOR" | "ADMIN">();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: UpdateUser) => {
      const response = await fetch(`/api/users/${innerProps.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to update user!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else {
          const errorData = await response.json();
          toast.error(
            errorData.error ||
              "Failed to update the user, internal server error!"
          );
        }
        return errorData;
      } else {
        toast.success("User updated successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        context.closeModal(id);
        return response.json();
      }
    },
  });

  const onSubmit = (data: UpdateUser) => {
    mutate(data);
  };

  useEffect(() => {
    if (innerProps.data) {
      const type = innerProps.data.userType as "USER" | "ADMIN" | "OPERATOR";
      setUserType(type);
      setValue("userType", type);
    }
  }, [innerProps.data, setValue]);

  return (
    <div className="flex flex-col w-full sm:px-4 px-2 sm:pb-4 pb-3 pt-4 sm:gap-4 gap-3">
      <p className="text-sm text-gray-500">
        Edit the user details below. Changes will be saved instantly.
      </p>

      <form
        className="flex flex-col w-full gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Select
          label={<span className="font-medium text-gray-700">User Type</span>}
          placeholder="Select GST slab"
          value={userType}
          data={["USER", "OPERATOR", "ADMIN"]}
          onChange={(val) => {
            setValue("userType", val as "USER" | "OPERATOR" | "ADMIN");
            setUserType(val as "USER" | "OPERATOR" | "ADMIN");
          }}
          required
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          error={errors.userType?.message}
          variant="filled"
        />

        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 rounded-md transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 cursor-pointer mt-2 border border-gray-600"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={16} color="white" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
};

export default EditUserModalContent;
