import type { Database } from "@/lib/types/database.types";

export type BoardComment =
  Database["public"]["Tables"]["dream_board_comments"]["Row"];

export type BoardItem =
  Database["public"]["Tables"]["dream_board_items"]["Row"] & {
    signedUrl: string | null;
    comments: BoardComment[];
  };
