CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "categories_workspace_name_unique" UNIQUE("workspace_id","name")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(180) NOT NULL,
	"sku" varchar(80) NOT NULL,
	"barcode" varchar(100),
	"description" text,
	"unit" varchar(30) DEFAULT 'pcs' NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "products_workspace_sku_unique" UNIQUE("workspace_id","sku"),
	CONSTRAINT "products_cost_price_non_negative_check" CHECK ("products"."cost_price" >= 0),
	CONSTRAINT "products_selling_price_non_negative_check" CHECK ("products"."selling_price" >= 0),
	CONSTRAINT "products_minimum_stock_non_negative_check" CHECK ("products"."minimum_stock" >= 0)
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_category_fk" FOREIGN KEY ("workspace_id","category_id") REFERENCES "public"."categories"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_workspace_name_idx" ON "categories" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_workspace_barcode_unique_idx" ON "products" USING btree ("workspace_id","barcode") WHERE "products"."barcode" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "products_workspace_name_idx" ON "products" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "products_workspace_category_idx" ON "products" USING btree ("workspace_id","category_id");--> statement-breakpoint
CREATE INDEX "products_workspace_deleted_at_idx" ON "products" USING btree ("workspace_id","deleted_at");--> statement-breakpoint
CREATE INDEX "products_workspace_active_idx" ON "products" USING btree ("workspace_id","is_active");