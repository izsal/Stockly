CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(40),
	"email" varchar(255),
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "suppliers_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "inventory_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_stocks_workspace_product_warehouse_unique" UNIQUE("workspace_id","product_id","warehouse_id"),
	CONSTRAINT "inventory_stocks_quantity_non_negative_check" CHECK ("inventory_stocks"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"supplier_id" uuid,
	"created_by" text NOT NULL,
	"type" text NOT NULL,
	"quantity_delta" integer NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reason" varchar(80),
	"reference_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_type_check" CHECK ("inventory_movements"."type" in ('IN', 'OUT', 'ADJUSTMENT')),
	CONSTRAINT "inventory_movements_quantity_consistency_check" CHECK ("inventory_movements"."quantity_after" = "inventory_movements"."quantity_before" + "inventory_movements"."quantity_delta"),
	CONSTRAINT "inventory_movements_quantity_before_non_negative_check" CHECK ("inventory_movements"."quantity_before" >= 0),
	CONSTRAINT "inventory_movements_quantity_after_non_negative_check" CHECK ("inventory_movements"."quantity_after" >= 0)
);
--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_workspace_id_id_unique" UNIQUE("workspace_id","id");--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_workspace_product_fk" FOREIGN KEY ("workspace_id","product_id") REFERENCES "public"."products"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_workspace_warehouse_fk" FOREIGN KEY ("workspace_id","warehouse_id") REFERENCES "public"."warehouses"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workspace_product_fk" FOREIGN KEY ("workspace_id","product_id") REFERENCES "public"."products"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workspace_warehouse_fk" FOREIGN KEY ("workspace_id","warehouse_id") REFERENCES "public"."warehouses"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workspace_supplier_fk" FOREIGN KEY ("workspace_id","supplier_id") REFERENCES "public"."suppliers"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_workspace_name_unique_idx" ON "suppliers" USING btree ("workspace_id","name") WHERE "suppliers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "suppliers_workspace_name_idx" ON "suppliers" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "suppliers_workspace_deleted_at_idx" ON "suppliers" USING btree ("workspace_id","deleted_at");--> statement-breakpoint
CREATE INDEX "inventory_stocks_workspace_warehouse_idx" ON "inventory_stocks" USING btree ("workspace_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_workspace_created_at_idx" ON "inventory_movements" USING btree ("workspace_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inventory_movements_workspace_product_idx" ON "inventory_movements" USING btree ("workspace_id","product_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inventory_movements_workspace_warehouse_idx" ON "inventory_movements" USING btree ("workspace_id","warehouse_id","created_at" DESC NULLS LAST);