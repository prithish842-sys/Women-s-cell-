import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { 
  Users, Plus, Trash2, ShieldAlert, CheckCircle, 
  HelpCircle, RefreshCw, Key, Landmark 
} from 'lucide-react';

export const AdminFaculty: React.FC = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form toggling
  const [showForm, setShowForm] = useState(false);

  // New Faculty fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/admin/faculty');
      if (res.data.success) {
        setFaculty(res.data.data);
      } else {
        setErrorMsg('Failed to query faculty registries.');
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setErrorMsg('Lost connection to faculty database server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !staffId.trim() || !department.trim() || !password.trim()) {
      setErrorMsg('All fields must be supplied to provision a faculty login.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      staffId: staffId.toUpperCase().trim(),
      department: department.trim(),
      password
    };

    try {
      const res = await api.post('/admin/faculty', payload);
      if (res.data.success) {
        setSuccessMsg(`Faculty account for Prof. ${name} created successfully!`);
        setShowForm(false);
        // Reset fields
        setName('');
        setEmail('');
        setStaffId('');
        setDepartment('');
        setPassword('');
        fetchFaculty();
      } else {
        setErrorMsg(res.data.message || 'Failed to register instructor account.');
      }
    } catch (err: any) {
      console.error('Error creating faculty:', err);
      setErrorMsg(err.response?.data?.message || 'Server error provisioning account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete faculty account for Prof. ${name}? She will lose portal search access immediately.`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/admin/faculty/${id}`);
      if (res.data.success) {
        setSuccessMsg(`Faculty credentials for Prof. ${name} have been deactivated.`);
        fetchFaculty();
      } else {
        setErrorMsg('Failed to delete faculty credentials.');
      }
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setErrorMsg('Connection error during deletion request.');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Faculty Advisor Registries</h1>
          <p className="text-xs text-gray-500">Manage department heads and advisory staff allowed to query student talent.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold inline-flex items-center space-x-1 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Faculty Account</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start space-x-2">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Creation Form */}
      {showForm && (
        <section className="bg-white p-6 rounded-xl border-2 border-gold-600 shadow-md space-y-4">
          <div className="pb-2 border-b border-gray-150 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-maroon-700 flex items-center space-x-1.5">
              <Key className="w-4.5 h-4.5 text-rose-600" />
              <span>Provision Faculty Login credentials</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateFaculty} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Faculty Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Shanthi Rao"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">College Email</label>
              <input
                type="email"
                required
                placeholder="shanthi.rao@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            {/* Staff ID */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Staff ID (Unique)</label>
              <input
                type="text"
                required
                placeholder="STF202"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase">Department</label>
              <input
                type="text"
                required
                placeholder="Information Technology"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            {/* Password */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">Login Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters with letters and numbers"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>

            <div className="pt-3 sm:col-span-2 border-t flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-white font-bold rounded shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Provision Login Now'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Faculty List Table */}
      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center text-xs text-gray-500 animate-pulse">
          Querying credentials databases...
        </div>
      ) : faculty.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-500 text-xs">
          No faculty accounts registered yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Staff ID</th>
                  <th className="px-6 py-3">Faculty Name</th>
                  <th className="px-6 py-3">Email ID</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {faculty.map((f) => (
                  <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-maroon-700">{f.staffId || 'STAFF_ID'}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">Prof. {f.name}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{f.email}</td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{f.department}</td>
                    <td className="px-6 py-4 text-right">
                      {f.email !== 'meera.nair@college.edu' ? (
                        <button
                          onClick={() => handleDeleteFaculty(f._id, f.name)}
                          title="Purge Accounts"
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic font-mono px-1">Protected Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
