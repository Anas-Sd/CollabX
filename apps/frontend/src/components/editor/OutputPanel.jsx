import { useState, useEffect, useMemo } from "react";
import { Copy, Terminal, CheckCircle, XCircle, Plus, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { useRoomStore } from "../../store/roomStore";
import { useUserStore } from "../../store/userStore";

export default function OutputPanel({ wsHook }) {
  const {
    testCases, setTestCases,
    output, isExecuting,
    language, activeOutputTab, setActiveOutputTab
  } = useRoomStore();

  const { user } = useUserStore();
  const currentUserParticipant = useRoomStore(state => state.participants.find(p => p.id === user?.id));
  const isActive = useRoomStore(state => state.isActive);
  const isViewer = !isActive || currentUserParticipant?.role === 'VIEWER';

  const [newInput, setNewInput] = useState("");
  const [newExpected, setNewExpected] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (language === 'sql' && activeOutputTab !== 'OUTPUT') {
      setActiveOutputTab('OUTPUT');
    }
  }, [language, activeOutputTab, setActiveOutputTab]);

  const handleAddTestCase = () => {
    if (!newExpected.trim()) return;

    let updated;
    if (editingIndex !== null) {
      updated = [...testCases];
      updated[editingIndex] = { input: newInput, expectedOutput: newExpected };
      setEditingIndex(null);
    } else {
      updated = [...testCases, { input: newInput, expectedOutput: newExpected }];
    }

    setTestCases(updated);
    wsHook.sendTestCasesSync(updated);
    setNewInput("");
    setNewExpected("");
  };

  const removeTestCase = (index) => {
    const updated = [...testCases];
    updated.splice(index, 1);
    setTestCases(updated);
    wsHook.sendTestCasesSync(updated);

    if (editingIndex === index) {
      setEditingIndex(null);
      setNewInput("");
      setNewExpected("");
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleEditTestCase = (index) => {
    setEditingIndex(index);
    setNewInput(testCases[index].input || "");
    setNewExpected(testCases[index].expectedOutput || "");
  };

  const handleRemoveAll = () => {
    setTestCases([]);
    wsHook.sendTestCasesSync([]);
    setEditingIndex(null);
    setNewInput("");
    setNewExpected("");
  };

  const { executingUser, executionProgress } = useRoomStore();

  const getLoadingMessage = () => {
    if (!executionProgress) {
      return `${executingUser || 'Someone'} is executing...`;
    }
    if (executionProgress.stage === 'COMPILING') {
      return "Compiling...";
    }
    if (executionProgress.stage === 'RUNNING_TEST') {
      return `Running Test Case ${executionProgress.current} of ${executionProgress.total}...`;
    }
    return "Processing...";
  };

  // Derive variables for the UI
  const testResults = output?.type === 'SUBMIT' ? output.data?.results : null;

  return (
    <div className="h-full flex flex-col border-t border-border bg-[#0A0A0F]">
      <div className="flex items-center justify-between px-4 py-2 bg-surface/50 border-b border-[#1E1E2E]">
        <div className="flex space-x-4">
          {language !== 'sql' && (
            <button
              onClick={() => setActiveOutputTab("TEST_CASES")}
              className={`text-xs font-semibold cursor-pointer uppercase tracking-wider pb-1 border-b-2 transition-colors ${activeOutputTab === "TEST_CASES" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"}`}
            >
              Test Cases ({testCases.length})
            </button>
          )}
          <button
            onClick={() => setActiveOutputTab("OUTPUT")}
            className={`text-xs cursor-pointer font-semibold uppercase tracking-wider pb-1 border-b-2 transition-colors ${activeOutputTab === "OUTPUT" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"}`}
          >
            Output
          </button>
        </div>
        <button
          onClick={() => useRoomStore.getState().setShowOutputPanel(false)}
          className="text-muted-foreground cursor-pointer hover:text-white transition-colors text-xs"
        >
          Close Panel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeOutputTab === "OUTPUT" && (
          <div className="font-mono text-sm h-full w-full">
            {isExecuting ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-primary">
                <Loader2 className="w-6 h-6 animate-spin" />
                <pre className="text-[#E8E8F0] font-bold animate-pulse">{getLoadingMessage()}</pre>
              </div>
            ) : output?.compilationError ? (
              <pre className="text-[#FF4C4C] whitespace-pre-wrap">{output.error}</pre>
            ) : output?.error ? (
              <pre className="text-[#FF4C4C] whitespace-pre-wrap">{output.error}</pre>
            ) : (testResults && testResults.length > 0) ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-6 bg-[#111118] border border-border px-4 py-3 rounded-lg shrink-0 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Tests</span>
                    <span className="text-white font-bold text-base leading-none">{testResults.length}</span>
                  </div>
                  <div className="w-px h-6 bg-[#1E1E2E]"></div>
                  <div className="flex flex-col">
                    <span className="text-success tracking-wider text-[10px] uppercase font-bold mb-0.5">Passed</span>
                    <span className="text-success font-bold text-base leading-none inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />{testResults.filter(r => r.passed).length}</span>
                  </div>
                  <div className="w-px h-6 bg-[#1E1E2E]"></div>
                  <div className="flex flex-col">
                    <span className="text-danger tracking-wider text-[10px] uppercase font-bold mb-0.5">Failed</span>
                    <span className="text-danger font-bold text-base leading-none inline-flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />{testResults.filter(r => !r.passed).length}</span>
                  </div>
                </div>

                <table className="w-full text-left bg-surface border border-border shadow-sm rounded-lg overflow-hidden">
                  <thead className="bg-[#111118]">
                    <tr>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[12%]">Test Case</th>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[22%]">Input</th>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[22%]">Expected</th>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[24%]">Actual</th>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[10%]">Time</th>
                      <th className="p-3 text-xs font-semibold text-[#6B6B80] border-b border-border w-[10%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0A0A0F]">
                    {testResults.map((tr, i) => (
                      <tr key={i} className="hover:bg-[#1E1E2E] transition-colors border-b border-border/50 last:border-0 text-sm">
                        <td className="p-3">
                          <span className="text-muted-foreground text-[11px] font-bold tracking-wider">Test {i + 1}</span>
                        </td>
                        <td className="p-3 text-white font-mono text-xs whitespace-pre-wrap">{tr.input || "None"}</td>
                        <td className="p-3 text-white font-mono text-xs whitespace-pre-wrap">{tr.expectedOutput || "None"}</td>
                        <td className="p-3 text-white font-mono text-xs overflow-x-auto max-w-[200px] whitespace-pre-wrap">{tr.actualOutput || "None"}</td>
                        <td className="p-3 text-white text-xs">{tr.executionTimeMs}ms</td>
                        <td className="p-3">
                          {tr.passed ? (
                            <span className="inline-flex items-center gap-1 text-success text-[10px] font-semibold bg-success/10 px-2 py-1 rounded">
                              <CheckCircle className="w-3 h-3" /> PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger text-[10px] font-semibold bg-danger/10 px-2 py-1 rounded">
                              <XCircle className="w-3 h-3" /> FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : output ? (
              <pre className="text-[#E8E8F0] whitespace-pre-wrap">
                {output.output ? output.output : (output.exitCode === 0 ? "Execution completed successfully with no output." : JSON.stringify(output, null, 2))}
              </pre>
            ) : (
              <span className="text-muted-foreground text-xs italic">Submit your code to see execution results...</span>
            )}
          </div>
        )}

        {activeOutputTab === "TEST_CASES" && (
          <div className="w-full flex gap-4 items-start relative">
            {/* Form Section */}
            <div className="flex-1 flex flex-col space-y-3 pb-2 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Add Manual Test Case</h3>
              </div>

              {/* Two inputs side by side to save massive vertical space */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground block">
                    {language === 'sql' ? "Database Schema Script (SQL)" : "Standard Input"}
                  </label>
                  <textarea
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    disabled={isViewer}
                    placeholder={language === 'sql' ? "CREATE TABLE users(id INT);\nINSERT INTO users VALUES(1);" : "e.g. 1\n2\n3"}
                    className="w-full bg-[#111118] border border-border rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-primary h-[72px] resize-none disabled:opacity-50"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground block">
                    {language === 'sql' ? "Expected Query Tabulation" : "Expected Output"}
                  </label>
                  <textarea
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value)}
                    disabled={isViewer}
                    placeholder="Expected result..."
                    className="w-full bg-[#111118] border border-border rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-primary h-[72px] resize-none disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                onClick={handleAddTestCase}
                disabled={!newExpected.trim() || isViewer}
                title={isViewer ? "Viewers cannot modify test cases." : (editingIndex !== null ? "Update Test Case" : "Add Test Case")}
                className="w-full flex cursor-pointer items-center justify-center gap-2 py-2 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shrink-0"
              >
                {editingIndex !== null ? (
                  <><Edit2 className="w-4 h-4" /> Update Test Case</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add Test Case</>
                )}
              </button>
              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setNewInput("");
                    setNewExpected("");
                  }}
                  className="w-full flex cursor-pointer items-center justify-center gap-2 py-1.5 bg-[#1E1E2E] text-muted-foreground hover:text-white rounded transition-colors text-[10px] font-semibold shrink-0 mt-1"
                >
                  <X className="w-3 h-3" /> Cancel Edit
                </button>
              )}
            </div>

            {/* List Section */}
            <div className="flex-1 bg-[#111118] rounded border border-border p-3 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-2 border-b border-border pb-1">
                <h3 className="text-sm font-semibold text-white">Configured Test Cases ({testCases.length})</h3>
                {testCases.length > 0 && !isViewer && (
                  <button
                    onClick={handleRemoveAll}
                    className="text-[10px] cursor-pointer font-semibold text-danger hover:underline bg-danger/10 px-2 py-0.5 rounded"
                  >
                    Remove All
                  </button>
                )}
              </div>
              {testCases.length === 0 ? (
                <p className="text-xs text-muted-foreground italic flex-1">No custom test cases configured yet.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="relative group bg-[#0A0A0F] border border-border p-3 rounded flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded shadow-sm">
                          Test Case {idx + 1}
                        </span>
                        {!isViewer && (
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditTestCase(idx)} title="Edit" className="text-muted-foreground hover:text-success p-1 rounded hover:bg-[#1E1E2E] transition-colors">
                              <Edit2 className="w-3.5 h-3.5 cursor-pointer" />
                            </button>
                            <button onClick={() => removeTestCase(idx)} title="Delete" className="text-muted-foreground hover:text-danger p-1 rounded hover:bg-[#1E1E2E] transition-colors">
                              <Trash2 className="w-3.5 h-3.5 cursor-pointer" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden flex gap-4 w-full mt-1">
                        <div className="flex-1 bg-[#111118] p-2 rounded border border-border/50">
                          <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">{language === 'sql' ? "Schema:" : "Input:"}</p>
                          <pre className="text-[11px] text-[#E8E8F0] font-mono whitespace-pre-wrap break-all overflow-y-auto max-h-24">{tc.input || "<none>"}</pre>
                        </div>
                        <div className="flex-1 bg-[#111118] p-2 rounded border border-border/50">
                          <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">{language === 'sql' ? "Expected TSV:" : "Expected Output:"}</p>
                          <pre className="text-[11px] text-[#E8E8F0] font-mono whitespace-pre-wrap break-all overflow-y-auto max-h-24">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
