import { AddCategory, addCategorySchema } from "@/@types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, TextInput } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  onClose: () => void;
};

const CategoryAdd = ({ onClose }: Props) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<AddCategory>({
    resolver: zodResolver(addCategorySchema),
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AddCategory) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to add category!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(errorData.error || "Category already exists!", {
            style: {
              color: "#EF5026",
              fontWeight: 500,
            },
            icon: "⚠️",
          });
        } else {
          toast.error(
            errorData || "Failed to add category, internal server error"
          );
        }
        return errorData;
      } else {
        toast.success("Category added successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        onClose();
        return response.json();
      }
    },
  });

  const onSubmit = (data: AddCategory) => {
    mutate(data);
  };

  return (
    <form
      className="flex flex-col w-full sm:px-4 px-2 sm:pb-4 pb-3 sm:pt-6 pt-4 sm:gap-4 gap-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextInput
        type="text"
        label={<span className="font-medium text-gray-700">Title</span>}
        placeholder="Enter category title here..."
        {...register("title")}
        required
        classNames={{
          input:
            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
          label: "!mb-1 !text-gray-700",
        }}
        error={errors.title?.message}
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
          "Submit"
        )}
      </button>
    </form>
  );
};

export default CategoryAdd;
