import { AddPartyDetails, addPartyDetailsSchema } from "@/@types";
import { gstStateMapping } from "@/components/utils/constants";
import { stateOptions } from "@/components/utils/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, TextInput, Textarea, Select } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  onClose: () => void;
};

const PartyDetailsAdd = ({ onClose }: Props) => {
  const [hasGST, setHasGST] = useState(true);
  const [manualState, setManualState] = useState("");
  const [manualStateCode, setManualStateCode] = useState("");

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddPartyDetails>({
    resolver: zodResolver(addPartyDetailsSchema),
    defaultValues: {
      gstNumber: "",
      state: "",
      stateCode: "",
    },
  });

  const gstNumberValue = watch("gstNumber");
  const stateValue = watch("state");
  const stateCodeValue = watch("stateCode");

  useEffect(() => {
    if (gstNumberValue && gstNumberValue.length >= 2) {
      const stateCode = gstNumberValue.substring(0, 2);
      if (gstStateMapping[stateCode]) {
        setValue("state", gstStateMapping[stateCode]);
        setValue("stateCode", stateCode);
        setHasGST(true);
      }
    } else if (gstNumberValue === "") {
      setValue("state", "");
      setValue("stateCode", "");
    }
  }, [gstNumberValue, setValue]);

  const handleManualStateChange = (value: string | null) => {
    if (value) {
      const selectedState = value;
      setManualState(selectedState);

      // Find the state code for the selected state
      const stateEntry = Object.entries(gstStateMapping).find(
        (state) => state[1] === selectedState
      );

      if (stateEntry) {
        const [stateCode, stateName] = stateEntry;
        setValue("state", stateName);
        setValue("stateCode", stateCode);
        setManualStateCode(stateCode);
      }
    }
  };

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AddPartyDetails) => {
      const response = await fetch("/api/party-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error("You're not authorized to add party details!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(errorData || "Party name or GST number already exists!", {
            style: {
              color: "#EF5026",
              fontWeight: 500,
            },
            icon: "⚠️",
          });
        } else {
          toast.error(
            errorData || "Failed to create the party, internal server error"
          );
        }

        return errorData;
      } else {
        toast.success("Party details added successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["parties"] });
        onClose();
        return response.json();
      }
    },
  });

  const onSubmit = (data: AddPartyDetails) => {
    mutate(data);
  };

  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setValue("gstNumber", value);
  };

  const handleHasGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasGST(checked);

    if (!checked) {
      // Clear GST fields when unchecking
      setValue("gstNumber", "");
    } else {
      // Clear manual state fields when checking GST
      setManualState("");
      setManualStateCode("");
      setValue("state", "");
      setValue("stateCode", "");
    }
  };

  return (
    <form
      className="flex flex-col w-full sm:px-4 px-2 sm:pb-4 pb-3 sm:pt-6 pt-4 sm:gap-4 gap-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextInput
        type="text"
        label={<span className="font-medium text-gray-700">Party Name</span>}
        placeholder="Enter party name here..."
        {...register("name")}
        required
        classNames={{
          input:
            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
          label: "!mb-1 !text-gray-700",
        }}
        error={errors.name?.message}
        variant="filled"
      />

      <Textarea
        label={<span className="font-medium text-gray-700">Address</span>}
        placeholder="Enter party address here..."
        {...register("address")}
        required
        rows={3}
        classNames={{
          input:
            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50 !min-h-[100px]",
          label: "!mb-1 !text-gray-700",
        }}
        error={errors.address?.message}
        variant="filled"
      />

      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="hasGST"
          checked={hasGST}
          onChange={handleHasGSTChange}
          className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
          style={{ accentColor: "#475569" }}
        />
        <label htmlFor="hasGST" className="text-sm font-medium text-gray-700">
          Party has GST number
        </label>
      </div>

      {hasGST ? (
        <>
          <TextInput
            type="text"
            label={
              <span className="font-medium text-gray-700">GST Number</span>
            }
            placeholder="Enter GST number here..."
            {...register("gstNumber")}
            onChange={handleGSTChange}
            classNames={{
              input:
                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50 uppercase",
              label: "!mb-1 !text-gray-700",
            }}
            error={errors.gstNumber?.message}
            variant="filled"
            maxLength={15}
            required={hasGST}
          />

          <TextInput
            type="text"
            label={<span className="font-medium text-gray-700">State</span>}
            placeholder="Auto-filled from GST"
            value={stateValue || ""}
            readOnly
            classNames={{
              input:
                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
              label: "!mb-1 !text-gray-700",
            }}
            variant="filled"
          />

          <TextInput
            type="text"
            label={
              <span className="font-medium text-gray-700">State Code</span>
            }
            placeholder="Auto-filled from GST"
            value={stateCodeValue || ""}
            readOnly
            classNames={{
              input:
                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
              label: "!mb-1 !text-gray-700",
            }}
            variant="filled"
          />
        </>
      ) : (
        <>
          <Select
            label={<span className="font-medium text-gray-700">State</span>}
            placeholder="Select state"
            data={stateOptions}
            value={manualState}
            onChange={handleManualStateChange}
            required={!hasGST}
            classNames={{
              input:
                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
              label: "!mb-1 !text-gray-700",
            }}
            variant="filled"
          />
          <TextInput
            type="text"
            label={
              <span className="font-medium text-gray-700">State Code</span>
            }
            placeholder="Auto-filled from state selection"
            value={manualStateCode}
            readOnly
            classNames={{
              input:
                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
              label: "!mb-1 !text-gray-700",
            }}
            variant="filled"
          />
        </>
      )}

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

export default PartyDetailsAdd;
