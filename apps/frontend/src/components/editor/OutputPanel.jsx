import { useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import { Plus, X, Play } from 'lucide-react';
import api from '../../lib/api';

export default function OutputPanel({ wsHook }) {
  const { testCases, addTestCase, setTestCases, output, isExecuting, language, code, roomId, activeOutputTab, setActiveOutputTab } = useRoomStore();
  const { user } = useUserStore();
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');

  const handleAddTestCase = () => {
    if (!newInput && !newExpected) return;
    const updatedTests = [...testCases, { input: newInput, expectedOutput: newExpected }];
    setTestCases(updatedTests);
    wsHook.sendTestCasesSync(updatedTests);
    setNewInput('');
    setNewExpected('');
  };

  const handleRemoveTestCase = (index) => {
    const updatedTests = testCases.filter((_, i) => i !== index);
    setTestCases(updatedTests);
    wsHook.sendTestCasesSync(updatedTests);
  };

  const handleExecute = async () => {
    setActiveOutputTab('OUTPUT');
    wsHook.sendExecutionStatus('RUNNING');
    try {
      const res = await api.post('/execute', {
        roomId,
        code,
        language,
        testCases
      });
      // The backend should return execution result or test case results
      wsHook.sendExecutionResult(res.data);
    } catch (err) {
      wsHook.sendExecutionResult({
        error: err.response?.data?.message || 'Execution failed'
      });
    }
  };

  const handleEditTestCase = (index) => {
    const tc = testCases[index];
    setNewInput(tc.input);
    setNewExpected(tc.expectedOutput);
    handleRemoveTestCase(index);
  };

  const handleRemoveAllTestCases = () => {
    setTestCases([]);
    wsHook.sendTestCasesSync([]);
  };

  const currentUserParticipant = useRoomStore((state) => state.participants.find(p => p.id === user?.id));
  const isViewer = currentUserParticipant?.role === 'VIEWER';

  return (
    <div className="h-full flex flex-col bg-card border-t border-border">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-background/50">
        <div className="flex items-center gap-4 h-full">
          <button
            onClick={() => setActiveOutputTab('TEST_CASES')}
            className={`h-full text-xs font-bold tracking-wider ${activeOutputTab === 'TEST_CASES' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            TEST CASES ({testCases.length})
          </button>
          <button
            onClick={() => setActiveOutputTab('OUTPUT')}
            className={`h-full text-xs font-bold tracking-wider ${activeOutputTab === 'OUTPUT' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            OUTPUT
          </button>
        </div>
        <button className="text-xs text-muted-foreground hover:text-white">Close Panel</button>
      </div>

      {/* Panel Content */}
      <div className="flex-grow overflow-hidden p-4 bg-background">
        {activeOutputTab === 'TEST_CASES' ? (
          <div className="flex gap-6 h-full">
            {/* Add Test Case Form (Static Left Side) */}
            <div className={`flex-1 flex flex-col space-y-4 h-full ${isViewer ? 'opacity-60' : ''}`}>
              <h4 className="text-sm font-bold text-white shrink-0">Add Manual Test Case</h4>
              <div className="flex gap-4 flex-1 min-h-0">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-muted-foreground block mb-1">Standard Input</label>
                  <textarea
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    disabled={isViewer}
                    className="flex-1 w-full bg-card border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary resize-none font-mono disabled:cursor-not-allowed"
                    placeholder="e.g. 1&#10;2&#10;3"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-muted-foreground block mb-1">Expected Output</label>
                  <textarea
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value)}
                    disabled={isViewer}
                    className="flex-1 w-full bg-card border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary resize-none font-mono disabled:cursor-not-allowed"
                    placeholder="Expected result..."
                  />
                </div>
              </div>
              <button
                onClick={handleAddTestCase}
                disabled={isViewer}
                title={isViewer ? "Viewers cannot add test cases" : ""}
                className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed shrink-0"
              >
                <Plus size={16} /> Add Test Case
              </button>
            </div>

            {/* Configured Test Cases List (Scrollable Right Side) */}
            <div className="flex-1 bg-card border border-border rounded-lg p-4 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h4 className="text-sm font-bold text-white">Configured Test Cases ({testCases.length})</h4>
                {testCases.length > 0 && !isViewer && (
                  <button
                    onClick={handleRemoveAllTestCases}
                    className="text-xs text-danger hover:underline font-bold"
                  >
                    Remove All
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {testCases.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                    No custom test cases configured yet.
                  </div>
                ) : (
                  testCases.map((tc, idx) => (
                    <div key={idx} className="bg-background border border-border p-3 rounded-xl group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                          Test Case {idx + 1}
                        </span>
                        <div className={`flex gap-2 transition-opacity ${isViewer ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            onClick={() => handleEditTestCase(idx)}
                            disabled={isViewer}
                            className="text-muted-foreground hover:text-white"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                          </button>
                          <button
                            onClick={() => handleRemoveTestCase(idx)}
                            disabled={isViewer}
                            className="text-danger hover:text-danger/80"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Input</span>
                          <div className="bg-card border border-border/50 rounded p-2 text-xs font-mono text-white whitespace-pre-wrap break-words">
                            {tc.input || <span className="text-muted-foreground italic">empty</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Expected Output</span>
                          <div className="bg-card border border-border/50 rounded p-2 text-xs font-mono text-white whitespace-pre-wrap break-words">
                            {tc.expectedOutput || <span className="text-muted-foreground italic">empty</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {isExecuting ? (
              <div className="flex items-center justify-center h-full text-primary gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                Executing code on secure container...
              </div>
            ) : !output ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Run your code to see the output here.
              </div>
            ) : (
              <div className="font-mono text-sm">
                {output.error ? (
                  <div className="text-danger whitespace-pre-wrap">{output.error}</div>
                ) : output.type === 'SUBMIT' && output.data ? (
                  <div className="space-y-4">
                    <div className="text-lg font-bold">
                      Submission Result: {output.data.allPassed ? <span className="text-success">ALL PASSED</span> : <span className="text-danger">FAILED</span>}
                    </div>
                    {output.data.results?.map((res, i) => (
                      <div key={i} className={`p-3 border rounded ${res.passed ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
                        <div><strong>Test {i + 1}:</strong> {res.passed ? 'Passed' : 'Failed'} ({res.executionTimeMs}ms)</div>
                        {res.input && <div className="mt-1 text-muted-foreground text-xs">Input: {res.input}</div>}
                        {!res.passed && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-background rounded"><strong>Expected:</strong><br />{res.expectedOutput}</div>
                            <div className="p-2 bg-background rounded"><strong>Actual:</strong><br />{res.actualOutput}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-success whitespace-pre-wrap">{output.output || JSON.stringify(output, null, 2)}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
