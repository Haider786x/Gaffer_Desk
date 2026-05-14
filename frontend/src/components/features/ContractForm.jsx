import { Button } from "../shared/Button.jsx";
import { Input } from "../shared/Input.jsx";

export function ContractForm({
  contractExpiry,
  currentForm,
  onChange,
  onSubmit,
  isSaving,
}) {
  return (
    <div className="bg-app-elevated rounded-lg border border-app-border p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-app-text">Contract & form</h2>
        <p className="text-xs text-app-text-secondary mt-1">
          Update details that affect transfer value calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contract expiry"
          name="contractExpiry"
          type="date"
          value={contractExpiry || ""}
          onChange={onChange}
        />
        <Input
          label="Current form (0-99)"
          name="currentForm"
          type="number"
          min="0"
          max="99"
          value={currentForm ?? ""}
          onChange={onChange}
        />
      </div>

      <div>
        <Button type="button" variant="secondary" size="sm" onClick={onSubmit} isLoading={isSaving}>
          Save contract details
        </Button>
      </div>
    </div>
  );
}
