import React, { useState, useMemo } from 'react';
import type { Project, BudgetItem, IncomeItem } from '../types';
import { PlusIcon, TrashIcon, TrendingUpIcon } from './icons';

interface FinanceTrackerProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const DataBar = ({ value, total, color, label }: { value: number, total: number, color: string, label: string }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-theme-text">{label}</span>
                <span className="text-xs font-mono text-theme-text-secondary">{value.toFixed(2)}€</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full ${color} transition-all duration-500`} 
                    style={{ width: `${percentage}%`}}
                ></div>
            </div>
        </div>
    );
};

const FinanceTracker: React.FC<FinanceTrackerProps> = ({ project, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
    
    const [newBudgetItem, setNewBudgetItem] = useState({ description: '', category: 'Marketing' as BudgetItem['category'], budgeted: '', actual: '' });
    const [newIncomeItem, setNewIncomeItem] = useState({ description: '', category: 'Streaming' as IncomeItem['category'], projected: '', actual: '' });

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBudgetItem(prev => ({ ...prev, [name]: value }));
    };

    const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewIncomeItem(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = (type: 'budget' | 'income') => {
        if (type === 'budget') {
            if (!newBudgetItem.description || !newBudgetItem.budgeted) return;
            const item: BudgetItem = { id: crypto.randomUUID(), description: newBudgetItem.description, category: newBudgetItem.category, budgeted: parseFloat(newBudgetItem.budgeted) || 0, actual: parseFloat(newBudgetItem.actual) || 0 };
            onUpdateProject({ ...project, budget: [...project.budget, item] });
            setNewBudgetItem({ description: '', category: 'Marketing', budgeted: '', actual: '' });
        } else {
            if (!newIncomeItem.description || !newIncomeItem.projected) return;
            const item: IncomeItem = { id: crypto.randomUUID(), description: newIncomeItem.description, category: newIncomeItem.category, projected: parseFloat(newIncomeItem.projected) || 0, actual: parseFloat(newIncomeItem.actual) || 0 };
            onUpdateProject({ ...project, income: [...project.income, item] });
            setNewIncomeItem({ description: '', category: 'Streaming', projected: '', actual: '' });
        }
    };

    const handleDeleteItem = (type: 'budget' | 'income', id: string) => {
        if (type === 'budget') {
            onUpdateProject({ ...project, budget: project.budget.filter(item => item.id !== id) });
        } else {
            onUpdateProject({ ...project, income: project.income.filter(item => item.id !== id) });
        }
    };

    const totals = useMemo(() => {
        const budgetTotals = project.budget.reduce((acc, item) => ({ budgeted: acc.budgeted + item.budgeted, actual: acc.actual + item.actual }), { budgeted: 0, actual: 0 });
        const incomeTotals = project.income.reduce((acc, item) => ({ projected: acc.projected + item.projected, actual: acc.actual + item.actual }), { projected: 0, actual: 0 });
        const netActual = incomeTotals.actual - budgetTotals.actual;
        return { budgetTotals, incomeTotals, netActual };
    }, [project.budget, project.income]);

    const maxExpense = Math.max(totals.budgetTotals.budgeted, totals.budgetTotals.actual) || 1;
    const maxIncome = Math.max(totals.incomeTotals.projected, totals.incomeTotals.actual) || 1;

    const budgetCategories: BudgetItem['category'][] = ['Marketing', 'Producción', 'Video', 'Diseño', 'PR', 'Otro'];
    const incomeCategories: IncomeItem['category'][] = ['Streaming', 'Ventas Físicas', 'Merchandising', 'Sincronización', 'Otro'];

    return (
        <div className="w-full max-w-4xl p-4 md:p-6 bg-theme-bg-secondary backdrop-blur-md border border-theme-border-secondary rounded-lg animate-fade-in-step space-y-6">
            <div className="flex items-center gap-3"><TrendingUpIcon className="w-8 h-8 text-theme-accent-secondary" /><h2 className="text-xl font-bold text-theme-accent-secondary">Finanzas del Lanzamiento</h2></div>
            
             <div className="bg-black/20 p-4 rounded-lg border border-theme-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <h4 className="font-bold mb-3 text-theme-accent-secondary text-center">Gastos</h4>
                        <div className="space-y-2">
                           <DataBar value={totals.budgetTotals.actual} total={maxExpense} color="bg-theme-accent-secondary" label="Real"/>
                           <DataBar value={totals.budgetTotals.budgeted} total={maxExpense} color="bg-theme-border-secondary" label="Presupuestado"/>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <h4 className="font-bold mb-3 text-theme-accent text-center">Ingresos</h4>
                        <div className="space-y-2">
                           <DataBar value={totals.incomeTotals.actual} total={maxIncome} color="bg-theme-accent" label="Real"/>
                           <DataBar value={totals.incomeTotals.projected} total={maxIncome} color="bg-theme-border" label="Proyectado"/>
                        </div>
                    </div>
                    <div className="md:col-span-1 flex flex-col justify-center items-center p-4 rounded-lg bg-black/20">
                        <p className="text-sm text-theme-text-secondary">Beneficio Neto Real</p>
                        <p className={`text-3xl font-bold ${totals.netActual >= 0 ? 'text-theme-success' : 'text-theme-danger'}`}>{totals.netActual.toFixed(2)}€</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center bg-black/20 p-1 rounded-lg border border-theme-border"><button onClick={() => setActiveTab('expenses')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'expenses' ? 'bg-theme-accent-secondary/20 text-theme-accent-secondary' : 'text-theme-text-secondary hover:bg-white/10'}`}>Gastos</button><button onClick={() => setActiveTab('income')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-theme-accent/20 text-theme-accent' : 'text-theme-text-secondary hover:bg-white/10'}`}>Ingresos</button></div>
            
            {activeTab === 'expenses' && (
                <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-theme-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div className="sm:col-span-2 md:col-span-2"><label className="text-xs text-theme-text-secondary">Descripción Gasto</label><input type="text" name="description" value={newBudgetItem.description} onChange={handleBudgetChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <div><label className="text-xs text-theme-text-secondary">Categoría</label><select name="category" value={newBudgetItem.category} onChange={handleBudgetChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm">{budgetCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="text-xs text-theme-text-secondary">Presupuesto (€)</label><input type="number" name="budgeted" value={newBudgetItem.budgeted} onChange={handleBudgetChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <div><label className="text-xs text-theme-text-secondary">Gasto Real (€)</label><input type="number" name="actual" value={newBudgetItem.actual} onChange={handleBudgetChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <button onClick={() => handleAddItem('budget')} className="sm:col-span-2 md:col-span-5 w-full flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold bg-theme-accent-secondary/20 text-theme-accent-secondary hover:bg-theme-accent-secondary/30"><PlusIcon className="w-5 h-5"/> Añadir Gasto</button>
                    </div>
                    <div className="space-y-2">{project.budget.map(item => (<div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-black/20 hover:bg-white/5 text-sm"><div className="col-span-5 font-semibold">{item.description}</div><div className="col-span-2 text-xs"><span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-md">{item.category}</span></div><div className="col-span-2 text-right text-theme-accent-secondary">{item.budgeted.toFixed(2)}€</div><div className="col-span-2 text-right text-theme-accent-secondary font-bold">{item.actual.toFixed(2)}€</div><div className="col-span-1 text-right"><button onClick={() => handleDeleteItem('budget', item.id)} className="p-1.5 text-theme-text-secondary hover:text-theme-danger hover:bg-theme-danger/10 rounded-full"><TrashIcon className="w-4 h-4" /></button></div></div>))}</div>
                </div>
            )}
            {activeTab === 'income' && (
                 <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-theme-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div className="sm:col-span-2 md:col-span-2"><label className="text-xs text-theme-text-secondary">Descripción Ingreso</label><input type="text" name="description" value={newIncomeItem.description} onChange={handleIncomeChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <div><label className="text-xs text-theme-text-secondary">Categoría</label><select name="category" value={newIncomeItem.category} onChange={handleIncomeChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm">{incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div><label className="text-xs text-theme-text-secondary">Proyectado (€)</label><input type="number" name="projected" value={newIncomeItem.projected} onChange={handleIncomeChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <div><label className="text-xs text-theme-text-secondary">Ingreso Real (€)</label><input type="number" name="actual" value={newIncomeItem.actual} onChange={handleIncomeChange} className="w-full p-2 bg-theme-bg border border-theme-border-secondary rounded-md text-sm" /></div>
                        <button onClick={() => handleAddItem('income')} className="sm:col-span-2 md:col-span-5 w-full flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold bg-theme-accent/20 text-theme-accent hover:bg-theme-accent/30"><PlusIcon className="w-5 h-5"/> Añadir Ingreso</button>
                    </div>
                    <div className="space-y-2">{project.income.map(item => (<div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-black/20 hover:bg-white/5 text-sm"><div className="col-span-5 font-semibold">{item.description}</div><div className="col-span-2 text-xs"><span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md">{item.category}</span></div><div className="col-span-2 text-right text-theme-accent">{item.projected.toFixed(2)}€</div><div className="col-span-2 text-right text-theme-accent font-bold">{item.actual.toFixed(2)}€</div><div className="col-span-1 text-right"><button onClick={() => handleDeleteItem('income', item.id)} className="p-1.5 text-theme-text-secondary hover:text-theme-danger hover:bg-theme-danger/10 rounded-full"><TrashIcon className="w-4 h-4" /></button></div></div>))}</div>
                </div>
            )}
        </div>
    );
};

export default FinanceTracker;