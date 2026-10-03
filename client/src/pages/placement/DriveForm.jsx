import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { placementApi } from "../../api/placementApi";
import { getApiError } from "../../utils/helpers";
import { PageTitle } from "../../components/common/UI";
import { ArrowLeft, Save, Loader } from "lucide-react";
import toast from "react-hot-toast";

const BRANCHES = ["MCA", "BCA", "BBA", "BSc IT", "BCom"];

const emptyForm = {
  company: "",
  jobRole: "",
  ctc: "",
  description: "",
  venue: "",
  deadline: "",
  driveDate: "",
  eligibility: {
    minCgpa: "",
    maxBacklogs: 0,
    allowedBranches: [],
  },
};

function toInputDate(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function DriveForm() {
  const { driveId } = useParams();
  const isEdit = Boolean(driveId);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await placementApi.getMyDrives();
        const drives = data.data.drives;
        const drive = drives.find((d) => d._id === driveId);
        if (!drive) {
          toast.error("Drive not found");
          navigate("/placement/drives");
          return;
        }
        setForm({
          company: drive.company || "",
          jobRole: drive.jobRole || "",
          ctc: drive.ctc ?? "",
          description: drive.description || "",
          venue: drive.venue || "",
          deadline: toInputDate(drive.deadline),
          driveDate: toInputDate(drive.driveDate),
          eligibility: {
            minCgpa: drive.eligibility?.minCgpa ?? "",
            maxBacklogs: drive.eligibility?.maxBacklogs ?? 0,
            allowedBranches: drive.eligibility?.allowedBranches || [],
          },
        });
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [driveId, isEdit, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setElig = (key) => (e) =>
    setForm((f) => ({ ...f, eligibility: { ...f.eligibility, [key]: e.target.value } }));

  const toggleBranch = (branch) =>
    setForm((f) => {
      const current = f.eligibility.allowedBranches;
      const next = current.includes(branch)
        ? current.filter((b) => b !== branch)
        : [...current, branch];
      return { ...f, eligibility: { ...f.eligibility, allowedBranches: next } };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.eligibility.allowedBranches.length === 0) {
      toast.error("Select at least one eligible branch");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company: form.company.trim(),
        jobRole: form.jobRole.trim(),
        ctc: parseFloat(form.ctc),
        description: form.description.trim(),
        venue: form.venue.trim(),
        deadline: form.deadline,
        driveDate: form.driveDate || undefined,
        eligibility: {
          minCgpa: parseFloat(form.eligibility.minCgpa),
          maxBacklogs: parseInt(form.eligibility.maxBacklogs, 10) || 0,
          allowedBranches: form.eligibility.allowedBranches,
        },
      };

      if (isEdit) {
        await placementApi.updateDrive(driveId, payload);
        toast.success("Drive updated successfully");
      } else {
        await placementApi.createDrive(payload);
        toast.success("Drive published successfully");
      }
      navigate("/placement/drives");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="animate-fade-rise">
      <PageTitle title={isEdit ? "Edit Drive" : "Publish New Drive"} />

      <div className="page-hero">
        <div className="page-hero-dots" />
        <div className="page-hero-content">
          <button
            onClick={() => navigate("/placement/drives")}
            className="flex items-center gap-2 font-sans text-sm mb-4 transition-colors"
            style={{ color: "var(--hero-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manage Drives
          </button>
          <h1 className="hero-title font-serif text-2xl font-bold" style={{ color: "var(--hero-text)" }}>
            {isEdit ? "Edit Placement Drive" : "Publish New Drive"}
          </h1>
          <p className="hero-subtitle font-sans text-sm mt-1" style={{ color: "var(--hero-muted)" }}>
            {isEdit
              ? "Update the drive details. All fields marked * are required."
              : "Fill in the drive details to publish it and let eligible students apply."}
          </p>
        </div>
      </div>

      <div className="page-container max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="cpm-card p-6 space-y-4">
            <h2 className="type-h4" style={{ color: "var(--text)" }}>Company Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company Name *</label>
                <input className="form-input" placeholder="e.g. Infosys" value={form.company} onChange={set("company")} required />
              </div>
              <div>
                <label className="form-label">Job Role *</label>
                <input className="form-input" placeholder="e.g. Software Engineer" value={form.jobRole} onChange={set("jobRole")} required />
              </div>
              <div>
                <label className="form-label">CTC (LPA) *</label>
                <input type="number" min="0" step="0.1" className="form-input no-spinner" placeholder="e.g. 6.5" value={form.ctc} onChange={set("ctc")} required />
              </div>
              <div>
                <label className="form-label">Venue</label>
                <input className="form-input" placeholder="e.g. Campus Main Hall / Online" value={form.venue} onChange={set("venue")} />
              </div>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Job profile, responsibilities..." value={form.description} onChange={set("description")} />
            </div>
          </div>

          <div className="cpm-card p-6 space-y-4">
            <h2 className="type-h4" style={{ color: "var(--text)" }}>Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Application Deadline *</label>
                <input type="date" className="form-input" value={form.deadline} onChange={set("deadline")} required />
              </div>
              <div>
                <label className="form-label">Drive Date</label>
                <input type="date" className="form-input" value={form.driveDate} onChange={set("driveDate")} />
              </div>
            </div>
          </div>

          <div className="cpm-card p-6 space-y-4">
            <h2 className="type-h4" style={{ color: "var(--text)" }}>Eligibility Criteria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Minimum CGPA *</label>
                <input type="number" min="0" max="10" step="0.1" className="form-input no-spinner" placeholder="e.g. 6.5" value={form.eligibility.minCgpa} onChange={setElig("minCgpa")} required />
              </div>
              <div>
                <label className="form-label">Max Allowed Backlogs</label>
                <input type="number" min="0" step="1" className="form-input no-spinner" placeholder="0" value={form.eligibility.maxBacklogs} onChange={setElig("maxBacklogs")} />
              </div>
            </div>
            <div>
              <label className="form-label">Eligible Branches *</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BRANCHES.map((b) => {
                  const selected = form.eligibility.allowedBranches.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBranch(b)}
                      className="px-3 py-1.5 rounded text-xs font-semibold font-sans border transition-all duration-150"
                      style={
                        selected
                          ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                          : { background: "var(--bg-surface-2)", color: "var(--text-muted)", borderColor: "var(--border)" }
                      }
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              {form.eligibility.allowedBranches.length === 0 && (
                <p className="font-sans text-xs mt-1.5" style={{ color: "var(--error-text)" }}>
                  Select at least one branch
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end pb-8">
            <button type="button" className="btn-secondary" onClick={() => navigate("/placement/drives")}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <><Loader className="w-4 h-4 animate-spin" /> Saving</>
              ) : (
                <><Save className="w-4 h-4" /> {isEdit ? "Update Drive" : "Publish Drive"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}