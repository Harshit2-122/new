import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarIcon, Sparkles, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  type GenerateKundaliBody,
  GenerateKundaliBodyGender,
  GenerateKundaliBodyRelationshipStatus,
  GenerateKundaliBodyTimeAccuracy,
} from "@workspace/api-client-react";

const CONCERNS_OPTIONS = [
  "Career",
  "Marriage",
  "Money",
  "Love",
  "Relationship",
  "Health",
  "Family",
  "Legal Matters",
  "Mental Peace",
  "Spiritual Growth",
  "Education",
  "Children",
  "Travel & Foreign Settlement",
];

const DOB_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;

function parseDob(value: string): Date | undefined {
  if (!DOB_PATTERN.test(value)) return undefined;
  const [dd, mm, yyyy] = value.split("/").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd ||
    d > new Date() ||
    d < new Date("1900-01-01")
  ) {
    return undefined;
  }
  return d;
}

const formSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(GenerateKundaliBodyGender, { required_error: "Please select a gender" }),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  timeOfBirth: z.string().min(1, "Time of birth is required"),
  timeAccuracy: z.nativeEnum(GenerateKundaliBodyTimeAccuracy, { required_error: "Please select time accuracy" }),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  currentCity: z.string().min(1, "Current city is required"),
  relationshipStatus: z.nativeEnum(GenerateKundaliBodyRelationshipStatus, { required_error: "Please select relationship status" }),
  careerField: z.string().min(1, "Career field is required"),
  concerns: z.array(z.string()).min(1, "Select at least one concern"),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface KundaliFormProps {
  onSubmit: (data: GenerateKundaliBody) => void;
}

export function KundaliForm({ onSubmit }: KundaliFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      timeOfBirth: "",
      placeOfBirth: "",
      currentCity: "",
      careerField: "",
      concerns: [],
      additionalNotes: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    const data: GenerateKundaliBody = {
      ...values,
      dateOfBirth: format(values.dateOfBirth, "dd/MM/yyyy"),
    };
    onSubmit(data);
  };

  const handleReturn = () => {
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="min-h-[100dvh] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />
      </div>

      <div className="w-full max-w-3xl z-10 relative">
        <Button 
          variant="ghost" 
          className="mb-8 text-muted-foreground hover:text-foreground font-serif"
          onClick={handleReturn}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Return to entrance
        </Button>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-primary mb-4">Your Cosmic Imprint</h2>
          <div className="w-16 h-px bg-secondary mx-auto mb-4" />
          <p className="text-muted-foreground font-serif italic text-lg">
            Provide the details of your birth to calculate your planetary alignments.
          </p>
        </div>

        <div className="bg-card border border-card-border p-8 md:p-12 rounded-sm shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-12">
              
              {/* Section 1: Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-secondary font-serif text-xl">I.</span>
                  <h3 className="text-2xl font-serif text-foreground">Identity</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={GenerateKundaliBodyGender.male} />
                              </FormControl>
                              <FormLabel className="font-normal">Male</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={GenerateKundaliBodyGender.female} />
                              </FormControl>
                              <FormLabel className="font-normal">Female</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={GenerateKundaliBodyGender.other} />
                              </FormControl>
                              <FormLabel className="font-normal">Other</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Section 2: Birth Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-secondary font-serif text-xl">II.</span>
                  <h3 className="text-2xl font-serif text-foreground">Birth Origin</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const textValue = field.value ? format(field.value, "dd/MM/yyyy") : "";
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="DD/MM/YYYY"
                                className="bg-input/50 flex-1"
                                inputMode="numeric"
                                defaultValue={textValue}
                                key={textValue}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const parsed = parseDob(v);
                                  if (parsed) field.onChange(parsed);
                                }}
                                onBlur={(e) => {
                                  const v = e.target.value.trim();
                                  if (!v) {
                                    field.onChange(undefined);
                                    return;
                                  }
                                  const parsed = parseDob(v);
                                  if (parsed) {
                                    field.onChange(parsed);
                                  } else {
                                    field.onChange(undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="bg-input/50 shrink-0"
                                  aria-label="Open calendar"
                                >
                                  <CalendarIcon className="h-4 w-4 opacity-70" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormDescription>Type as DD/MM/YYYY or pick from calendar</FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="timeOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time of Birth</FormLabel>
                          <FormControl>
                            <Input type="time" className="bg-input/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeAccuracy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accuracy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input/50">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={GenerateKundaliBodyTimeAccuracy.exact}>Exact</SelectItem>
                              <SelectItem value={GenerateKundaliBodyTimeAccuracy.approximate}>Approximate</SelectItem>
                              <SelectItem value={GenerateKundaliBodyTimeAccuracy.unknown}>Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="placeOfBirth"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Place of Birth</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mumbai, Maharashtra, India" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormDescription>City, State, Country</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Section 3: Current Life */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-secondary font-serif text-xl">III.</span>
                  <h3 className="text-2xl font-serif text-foreground">Current Path</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="currentCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current City of Residence</FormLabel>
                        <FormControl>
                          <Input placeholder="Where do you live now?" className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="careerField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Career Field / Profession</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineering, Arts..." className="bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationshipStatus"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Relationship Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input/50 md:w-1/2">
                              <SelectValue placeholder="Select your status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(GenerateKundaliBodyRelationshipStatus).map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="concerns"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Major Life Concerns</FormLabel>
                        <FormDescription>Select the areas you seek guidance on (at least one)</FormDescription>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {CONCERNS_OPTIONS.map((concern) => {
                            const isSelected = field.value.includes(concern);
                            return (
                              <Badge
                                key={concern}
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "cursor-pointer text-sm py-1.5 px-3 transition-colors",
                                  isSelected ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-muted"
                                )}
                                onClick={() => {
                                  if (isSelected) {
                                    field.onChange(field.value.filter((c) => c !== concern));
                                  } else {
                                    field.onChange([...field.value, concern]);
                                  }
                                }}
                              >
                                {concern}
                              </Badge>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Anything specific you'd like the chart to address…" 
                            className="bg-input/50 min-h-[100px] resize-y" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full font-serif text-lg py-8 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/50 shadow-xl transition-all duration-300 group"
                >
                  <Sparkles className="mr-3 h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  Reveal My Reading
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </motion.div>
  );
}
