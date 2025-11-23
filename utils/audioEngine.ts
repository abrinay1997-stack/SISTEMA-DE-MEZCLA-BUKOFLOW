
import { HeadphoneProfile } from '../types';

export class HeadphoneCalibrationEngine {
    private context: AudioContext;
    private filters: BiquadFilterNode[] = [];
    private preampNode: GainNode;
    private inputNode: GainNode;
    private outputNode: GainNode;
    private currentProfile: HeadphoneProfile | null = null;
    private currentAmount: number = 100; // 0 to 100
    private bypass: boolean = false;

    constructor(context: AudioContext) {
        this.context = context;
        
        // Initialize Nodes
        this.inputNode = context.createGain();
        this.preampNode = context.createGain();
        this.outputNode = context.createGain();

        // Default Routing: Input -> Preamp -> Output
        this.inputNode.connect(this.preampNode);
        this.preampNode.connect(this.outputNode);
    }

    public getInputNode(): AudioNode {
        return this.inputNode;
    }

    public getOutputNode(): AudioNode {
        return this.outputNode;
    }

    public loadProfile(profile: HeadphoneProfile | null) {
        this.currentProfile = profile;
        this.rebuildChain();
    }

    public setAmount(amount: number) {
        this.currentAmount = Math.max(0, Math.min(100, amount));
        this.updateFilterGains();
    }

    public setBypass(bypassed: boolean) {
        this.bypass = bypassed;
        this.updateFilterGains();
    }

    private rebuildChain() {
        // 1. Disconnect everything internally
        this.inputNode.disconnect();
        this.preampNode.disconnect();
        this.filters.forEach(f => f.disconnect());
        this.filters = [];

        // 2. If no profile or minimal setup, route directly
        if (!this.currentProfile) {
            this.inputNode.connect(this.outputNode);
            return;
        }

        // 3. Create Filters based on Profile
        let previousNode: AudioNode = this.preampNode;

        this.currentProfile.filters.forEach(f => {
            const filter = this.context.createBiquadFilter();
            
            // Map type string to BiquadFilterType
            if (f.type === 'LSC') filter.type = 'lowshelf';
            else if (f.type === 'HSC') filter.type = 'highshelf';
            else if (f.type === 'PK') filter.type = 'peaking';
            
            filter.frequency.value = f.fc;
            filter.Q.value = f.q;
            // Gain is set dynamically in updateFilterGains
            
            this.filters.push(filter);
            previousNode.connect(filter);
            previousNode = filter;
        });

        // 4. Route Input -> Preamp -> [Filters] -> Output
        this.inputNode.connect(this.preampNode);
        previousNode.connect(this.outputNode);

        // 5. Apply initial values
        this.updateFilterGains();
    }

    private updateFilterGains() {
        if (!this.currentProfile) return;

        const now = this.context.currentTime;
        const ratio = this.bypass ? 0 : (this.currentAmount / 100);

        // Update Preamp Gain (Linear interpolation)
        // If Bypass or 0%, Preamp = 0dB (Gain 1.0)
        // If 100%, Preamp = Profile Preamp
        const targetPreampDb = this.currentProfile.preamp * ratio;
        const targetPreampLinear = Math.pow(10, targetPreampDb / 20);
        
        this.preampNode.gain.cancelScheduledValues(now);
        this.preampNode.gain.setTargetAtTime(targetPreampLinear, now, 0.1); // Soft transition

        // Update Filters
        this.filters.forEach((filter, index) => {
            const profileFilter = this.currentProfile!.filters[index];
            const targetGain = profileFilter.gain * ratio;
            
            filter.gain.cancelScheduledValues(now);
            filter.gain.setTargetAtTime(targetGain, now, 0.1);
        });
    }
    
    // Clean up function if needed
    public dispose() {
        this.inputNode.disconnect();
        this.preampNode.disconnect();
        this.outputNode.disconnect();
        this.filters.forEach(f => f.disconnect());
    }
}
