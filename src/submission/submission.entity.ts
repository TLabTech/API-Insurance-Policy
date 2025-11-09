import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'submission_number', unique: true, nullable: true })
  submissionNumber?: string;

  @Column({ name: 'policy_holder_name' })
  policyHolderName: string;

  @Column({ name: 'policy_holder_dob', type: 'date' })
  policyHolderDOB: Date;

  @Column({ name: 'policy_holder_nik', type: 'bigint' })
  policyHolderNik: number;

  @Column({ name: 'product_id' })
  productID: string;

  @Column({ name: 'sum_assured', type: 'bigint' })
  sumAssured: number;

  @Column({ name: 'annual_premium', type: 'bigint' })
  annualPremium: number;

  @Column({ name: 'payment_freq' })
  paymentFreq: string;

  @Column()
  document: string;

  @Column()
  status: string;

  @Column()
  notes: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
