
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import "./App.css";

const client = generateClient<Schema>();

type Score = Schema["Score"]["type"];
type PlayerStat = Schema["PlayerStat"]["type"];

function App() {
  const [scores, setScores] = useState<Array<Score>>([]);
  const [playerStats, setPlayerStats] = useState<Array<PlayerStat>>([]);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [editingStat, setEditingStat] = useState<PlayerStat | null>(null);

  // Calculate totals
  const totals = {
    tsim: scores.reduce((sum, score) => sum + (score.tsim || 0), 0),
    jason: scores.reduce((sum, score) => sum + (score.jason || 0), 0),
    wai: scores.reduce((sum, score) => sum + (score.wai || 0), 0),
    mumSoup: scores.reduce((sum, score) => sum + (score.mumSoup || 0), 0),
  };

  useEffect(() => {
    // Subscribe to scores data
    const scoreSubscription = client.models.Score.observeQuery().subscribe({
      next: (data) => setScores([...data.items].sort((a, b) => a.roundNumber - b.roundNumber)),
    });

    // Subscribe to player stats data
    const statSubscription = client.models.PlayerStat.observeQuery().subscribe({
      next: (data) => setPlayerStats([...data.items]),
    });

    return () => {
      scoreSubscription.unsubscribe();
      statSubscription.unsubscribe();
    };
  }, []);

  const createScore = () => {
    const roundNumber = scores.length > 0 ? Math.max(...scores.map(s => s.roundNumber)) + 1 : 1;
    
    client.models.Score.create({
      roundNumber,
      tsim: 0,
      jason: 0,
      wai: 0,
      mumSoup: 0,
    });
  };

  const updateScore = (score: Score) => {
    if (editingScore) {
      client.models.Score.update(editingScore);
      setEditingScore(null);
    }
  };

  const deleteScore = (id: string) => {
    if (window.confirm("Are you sure you want to delete this round?")) {
      client.models.Score.delete({ id });
    }
  };

  const updatePlayerStat = (stat: PlayerStat) => {
    if (editingStat) {
      client.models.PlayerStat.update(editingStat);
      setEditingStat(null);
    }
  };

  const initializeStats = () => {
    const defaultStats = [
      { playerName: "Tsim", winByOthers: 0, selfDrawn: 0, paidOut: 0, specialBonus: 0 },
      { playerName: "Jason", winByOthers: 0, selfDrawn: 0, paidOut: 0, specialBonus: 0 },
      { playerName: "Wai", winByOthers: 0, selfDrawn: 0, paidOut: 0, specialBonus: 0 },
      { playerName: "MumSoup", winByOthers: 0, selfDrawn: 0, paidOut: 0, specialBonus: 0 },
    ];

    defaultStats.forEach(stat => {
      client.models.PlayerStat.create(stat);
    });
  };

  return (
    <div className="app-container">
      <h1>Mahjong Score Board</h1>
      
      {/* Main Score Table */}
      <div className="table-section">
        <div className="table-header">
          <h2>Scores by Round</h2>
          <button 
            onClick={createScore}
            className="btn btn-primary"
          >
            + Add Round
          </button>
        </div>
        
        <div className="table-wrapper">
          <table className="score-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Tsim</th>
                <th>Jason</th>
                <th>Wai</th>
                <th>MumSoup</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td className="round-cell">
                    {score.roundNumber}
                  </td>
                  {["tsim", "jason", "wai", "mumSoup"].map((field) => (
                    <td key={field} className="score-cell">
                      {editingScore?.id === score.id ? (
                        <input
                          type="number"
                          value={editingScore[field as keyof Score] as number || 0}
                          onChange={(e) => setEditingScore({
                            ...editingScore,
                            [field]: parseInt(e.target.value) || 0
                          })}
                          className="score-input"
                        />
                      ) : (
                        <span className="score-value">
                          {score[field as keyof Score] || 0}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="action-cell">
                    {editingScore?.id === score.id ? (
                      <>
                        <button 
                          onClick={() => updateScore(score)}
                          className="btn btn-success btn-sm"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingScore(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setEditingScore(score)}
                          className="btn btn-warning btn-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteScore(score.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>Total</td>
                <td>{totals.tsim}</td>
                <td>{totals.jason}</td>
                <td>{totals.wai}</td>
                <td>{totals.mumSoup}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Player Statistics Table */}
      <div className="table-section">
        <div className="table-header">
          <h2>Player Statistics</h2>
          {playerStats.length === 0 && (
            <button 
              onClick={initializeStats}
              className="btn btn-success"
            >
              Initialize Stats
            </button>
          )}
        </div>
        
        <div className="table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>食胡</th>
                <th>自摸</th>
                <th>出統</th>
                <th>特別賞罰</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stat) => (
                <tr key={stat.id}>
                  <td className="player-cell">
                    {stat.playerName}
                  </td>
                  {["winByOthers", "selfDrawn", "paidOut", "specialBonus"].map((field) => (
                    <td key={field} className="stat-cell">
                      {editingStat?.id === stat.id ? (
                        <input
                          type="number"
                          value={editingStat[field as keyof PlayerStat] as number || 0}
                          onChange={(e) => setEditingStat({
                            ...editingStat,
                            [field]: parseInt(e.target.value) || 0
                          })}
                          className="stat-input"
                        />
                      ) : (
                        <span className="stat-value">
                          {stat[field as keyof PlayerStat] || 0}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="action-cell">
                    {editingStat?.id === stat.id ? (
                      <>
                        <button 
                          onClick={() => updatePlayerStat(stat)}
                          className="btn btn-success btn-sm"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingStat(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setEditingStat(stat)}
                        className="btn btn-warning btn-sm"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="instructions">
        <h3>How to use:</h3>
        <ul>
          <li>Click "Add Round" to add a new round of scores</li>
          <li>Click "Edit" to modify scores or statistics</li>
          <li>Click "Initialize Stats" to set up player statistics if not already created</li>
          <li>All changes are automatically saved to the database</li>
        </ul>
      </div>
    </div>
  );
}

export default App;