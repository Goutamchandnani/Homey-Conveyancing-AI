import { Card, CardContent } from "@/components/ui/card";
import { useDocumentStore } from "@/stores/documentStore";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  PoundSterling,
  Calendar,
  Home,
  Hash,
  Scale,
  Building,
} from "lucide-react";
import type { ExtractedData as ExtractedDataType } from "@/types";

interface DataCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  index: number;
}

function DataCard({ icon, label, value, index }: DataCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <Card className="bg-card border-border hover:border-homey-purple/30 transition-colors h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-homey-purple/10 text-homey-purple-light shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-sm font-medium text-foreground mt-1 truncate">
                {value || (
                  <span className="text-muted-foreground/50 italic">
                    Not found
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Grid of extracted key data fields from the document.
 */
export function ExtractedDataPanel() {
  const extractedData = useDocumentStore((s) => s.extractedData);

  if (!extractedData) return null;

  const fields = buildFields(extractedData);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Key Information
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fields.map((field, i) => (
          <DataCard
            key={field.label}
            icon={field.icon}
            label={field.label}
            value={field.value}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}

function buildFields(data: ExtractedDataType) {
  return [
    {
      icon: <Users className="w-4 h-4" />,
      label: "Buyer",
      value: data.parties.buyer,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Seller",
      value: data.parties.seller,
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: "Address",
      value: data.property_address,
    },
    {
      icon: <PoundSterling className="w-4 h-4" />,
      label: "Price",
      value: data.purchase_price,
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: "Completion",
      value: data.completion_date,
    },
    {
      icon: <Home className="w-4 h-4" />,
      label: "Tenure",
      value: data.tenure,
    },
    {
      icon: <Hash className="w-4 h-4" />,
      label: "Title No.",
      value: data.title_number,
    },
    {
      icon: <Scale className="w-4 h-4" />,
      label: "Buyer's Solicitor",
      value: data.solicitors.buyer,
    },
    {
      icon: <Building className="w-4 h-4" />,
      label: "Seller's Solicitor",
      value: data.solicitors.seller,
    },
  ];
}
