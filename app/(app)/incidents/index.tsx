import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function IncidentsIndex() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  useEffect(() => {
    const isOfficer = role === "officer";
    router.replace({
      pathname: isOfficer ? "/incidents/manage-incidents" : "/incidents/report-incidents",
      params: { role: isOfficer ? "officer" : "citizen" },
    });
  }, [role]);

  // Renders nothing; immediately redirects.
  return <View />;
}
