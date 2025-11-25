import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';

@Entity()
export class LinkEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public slug: string;

  @Column()
  public url: string;

  @Column({ nullable: true })
  public expiresAt: Date | null;

  @Column({ default: 0 })
  public visits: number;

  @BeforeInsert()
  private generateSlug() {
    if (!this.slug) {
      this.slug = Math.random().toString(36).substring(2, 6);
    }
  }
}
