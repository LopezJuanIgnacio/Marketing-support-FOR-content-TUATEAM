import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Email Address</p>
            <p className="text-sm text-brand-grey">user@example.com</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Password</p>
            <p className="text-sm text-brand-grey">********</p>
          </div>
          <Button variant="outline">Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
