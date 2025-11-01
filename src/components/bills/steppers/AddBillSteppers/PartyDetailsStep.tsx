import { AddBill, AddPartyDetails, addPartyDetailsSchema } from "@/@types";
import CustomLoader from "@/components/common/CustomLoader";
import { gstStateMapping } from "@/components/utils/constants";
import { stateOptions } from "@/components/utils/helper";
import { usePartyDetailsData } from "@/hooks/use-queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Select, Textarea, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useForm,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus, FiX } from "react-icons/fi";

type Props = {
  setValue: UseFormSetValue<AddBill>;
  watch: UseFormWatch<AddBill>;
  control: Control<AddBill>;
  errors: FieldErrors<AddBill>;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const PartyDetailsStep = ({
  setValue,
  watch,
  control,
  errors,
  setActiveStep,
  containerRef,
}: Props) => {
  const [parties, setParties] = useState<{ _id: string; name: string }[]>([]);
  const [hasGST, setHasGST] = useState(true);
  const [manualState, setManualState] = useState("");
  const [manualStateCode, setManualStateCode] = useState("");
  const [showAddParty, setShowAddParty] = useState(false);

  // Party form
  const {
    register: registerParty,
    handleSubmit: handleSubmitParty,
    formState: { errors: partyErrors },
    setValue: setValueParty,
    reset: resetParty,
    watch: watchParty,
  } = useForm({
    resolver: zodResolver(addPartyDetailsSchema),
    defaultValues: {
      gstNumber: "",
      state: "",
      stateCode: "",
    },
  });

  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  const {
    data: partiesData,
    refetch: refetchParties,
    isLoading,
  } = usePartyDetailsData({
    limit: 100,
    offset: 0,
  });

  useEffect(() => {
    if (partiesData?.parties) {
      setParties(
        partiesData.parties.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
        }))
      );
    }
  }, [partiesData]);

  const gstNumberValue = watchParty("gstNumber");
  const stateValue = watchParty("state");
  const stateCodeValue = watchParty("stateCode");

  useEffect(() => {
    if (gstNumberValue && gstNumberValue.length >= 2) {
      const stateCode = gstNumberValue.substring(0, 2);
      if (gstStateMapping[stateCode]) {
        setValueParty("state", gstStateMapping[stateCode]);
        setValueParty("stateCode", stateCode);
        setHasGST(true);
      }
    } else if (gstNumberValue === "") {
      setValueParty("state", "");
      setValueParty("stateCode", "");
    }
  }, [gstNumberValue, setValueParty]);

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
        setValueParty("state", stateName);
        setValueParty("stateCode", stateCode);
        setManualStateCode(stateCode);
      }
    }
  };

  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setValueParty("gstNumber", value);
  };

  const handleHasGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasGST(checked);

    if (!checked) {
      // Clear GST fields when unchecking
      setValueParty("gstNumber", "");
    } else {
      // Clear manual state fields when checking GST
      setManualState("");
      setManualStateCode("");
      setValueParty("state", "");
      setValueParty("stateCode", "");
    }
  };

  // Create party mutation
  const { mutate: createParty, isPending: isCreatingParty } = useMutation({
    mutationFn: async (data: AddPartyDetails) => {
      const response = await fetch("/api/party-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          error: responseData.error || "Failed to create party",
        };
      }
      return responseData;
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Party created successfully!");
      refetchParties();
      setShowAddParty(false);
      resetParty();
      setValue("partyId", data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create party");
    },
  });

  const onSubmitParty = (data: AddPartyDetails) => {
    createParty(data);
  };

  const validateCurrentStep = () => {
    if (showAddParty) {
      // Validate party form fields
      const partyName = watchParty("name");
      const partyAddress = watchParty("address");
      if (!partyName || !partyAddress) {
        toast.error("Please complete all required party fields");
        return false;
      }
      if (hasGST && !watchParty("gstNumber")) {
        toast.error("GST number is required when party has GST");
        return false;
      }
      if (!hasGST && (!manualState || !manualStateCode)) {
        toast.error(
          "State and state code are required when party doesn't have GST"
        );
        return false;
      }
    } else if (!watch("partyId")) {
      toast.error("Please select a party or create a new one");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setActiveStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  return (
    <div className="space-y-4 mt-3">
      {isLoading ? (
        <CustomLoader />
      ) : (
        <>
          {!showAddParty ? (
            <div className="flex sm:flex-row flex-col sm:items-end gap-4 sm:w-[50%]">
              <Controller
                name="partyId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Select Party"
                    placeholder="Choose a party"
                    data={parties.map((p) => ({
                      value: p._id,
                      label: p.name,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.partyId?.message}
                    classNames={{
                      input:
                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50 sm:!w-[350px] !w-full",
                      label: "!mb-1 !text-gray-700",
                    }}
                    searchable
                  />
                )}
              />
              <Button
                onClick={() => setShowAddParty(true)}
                variant="outline"
                className="!border-gray-600 !text-gray-700 hover:!bg-gray-600 hover:!text-white"
                radius="md"
              >
                <FiPlus className="mr-2" /> Create New Party
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">
                  Create New Party
                </h3>
                <div
                  onClick={() => setShowAddParty(false)}
                  className="h-8 w-8 cursor-pointer hover:bg-gray-200 flex items-center justify-center rounded-md transition-colors"
                >
                  <FiX size={16} className="text-gray-600" />
                </div>
              </div>
              <form
                onSubmit={handleSubmitParty(onSubmitParty)}
                className="space-y-3"
              >
                <TextInput
                  type="text"
                  label={
                    <span className="font-medium text-gray-700">
                      Party Name
                    </span>
                  }
                  placeholder="Enter party name here..."
                  {...registerParty("name")}
                  required
                  classNames={{
                    input:
                      "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                    label: "!mb-1",
                  }}
                  error={partyErrors.name?.message}
                  variant="filled"
                />
                <Textarea
                  label={
                    <span className="font-medium text-gray-700">Address</span>
                  }
                  placeholder="Enter party address here..."
                  {...registerParty("address")}
                  required
                  rows={3}
                  classNames={{
                    input:
                      "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50 !min-h-[100px]",
                    label: "!mb-1",
                  }}
                  error={partyErrors.address?.message}
                  variant="filled"
                />
                <div className="flex items-center gap-2 mt-4 mb-3">
                  <input
                    type="checkbox"
                    id="hasGST"
                    checked={hasGST}
                    onChange={handleHasGSTChange}
                    className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                    style={{ accentColor: "#475569" }}
                  />
                  <label
                    htmlFor="hasGST"
                    className="text-sm font-medium text-gray-700"
                  >
                    Party has GST number
                  </label>
                </div>

                {hasGST ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4 gap-3">
                    <TextInput
                      type="text"
                      label={
                        <span className="font-medium text-gray-700">
                          GST Number
                        </span>
                      }
                      placeholder="Enter GST number here..."
                      {...registerParty("gstNumber")}
                      onChange={handleGSTChange}
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50 uppercase",
                        label: "!mb-1",
                      }}
                      error={partyErrors.gstNumber?.message}
                      variant="filled"
                      maxLength={15}
                      required={hasGST}
                    />

                    <TextInput
                      type="text"
                      label={
                        <span className="font-medium text-gray-700">State</span>
                      }
                      placeholder="Auto-filled from GST"
                      value={stateValue || ""}
                      readOnly
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                        label: "!mb-1",
                      }}
                      variant="filled"
                    />

                    <TextInput
                      type="text"
                      label={
                        <span className="font-medium text-gray-700">
                          State Code
                        </span>
                      }
                      placeholder="Auto-filled from GST"
                      value={stateCodeValue || ""}
                      readOnly
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                        label: "!mb-1",
                      }}
                      variant="filled"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-6 gap-3">
                    <Select
                      label={
                        <span className="font-medium text-gray-700">State</span>
                      }
                      placeholder="Select state"
                      data={stateOptions}
                      value={manualState}
                      onChange={handleManualStateChange}
                      required={!hasGST}
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                        label: "!mb-1",
                      }}
                      variant="filled"
                      searchable
                    />
                    <TextInput
                      type="text"
                      label={
                        <span className="font-medium text-gray-700">
                          State Code
                        </span>
                      }
                      placeholder="Auto-filled from state selection"
                      value={manualStateCode}
                      readOnly
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                        label: "!mb-1",
                      }}
                      variant="filled"
                    />
                  </div>
                )}
                <Group mt={20} mb={4}>
                  <Button
                    type="submit"
                    loading={isCreatingParty}
                    className="!bg-gray-700 hover:!bg-gray-800 !text-white"
                  >
                    Create Party
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddParty(false)}
                    className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                  >
                    Cancel
                  </Button>
                </Group>
              </form>
            </div>
          )}
        </>
      )}
      <Button
        onClick={handleNextStep}
        className="!bg-gray-700 hover:!bg-gray-800 !text-white"
        mt={8}
      >
        Next : Supply Details
      </Button>
    </div>
  );
};

export default PartyDetailsStep;
