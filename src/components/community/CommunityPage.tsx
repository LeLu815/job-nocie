"use client";

import React, { useState, useEffect } from "react";
import SideBar from "./SideBar";
import PostModal from "./PostModal";
import PostList from "./PostList";
import { createClient } from "@/supabase/client";
import { Database } from "@/supabase/database.types";

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<Database["public"]["Tables"]["community_post"]["Row"][]>([]);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const handlePostOpen = () => setPostModalOpen(true);
  const handlePostClose = () => setPostModalOpen(false);

  const addPost = (post: Database["public"]["Tables"]["community_post"]["Row"]) => {
    setPosts([post, ...posts]);
  };

  const fetchPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_post")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      console.log("Fetched posts:", data);
      setPosts(data || []);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex justify-center">
        <div className="flex w-full max-w-7xl border border-gray-300">
          <SideBar />
          <main className="w-3/4 p-4 bg-white h-screen overflow-auto border-l border-gray-300">
            <div className="mb-4 border-b border-gray-300 pb-4">
              <div className="flex items-center cursor-pointer bg-white p-4 rounded shadow" onClick={handlePostOpen}>
                <img src="/images/profile-placeholder.png" alt="프로필" className="w-10 h-10 rounded-full mr-2" />
                <span className="text-gray-500">나누고 싶은 생각을 공유해 보세요!</span>
              </div>
            </div>
            <div className="pt-4">
              <PostList posts={posts} />
            </div>
          </main>
        </div>
      </div>
      <PostModal open={postModalOpen} handleClose={handlePostClose} addPost={addPost} />
    </div>
  );
};

export default CommunityPage;
