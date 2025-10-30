import React from 'react'

const ListPost = () => {
  return (
    <div className="space-y-6">
            {dummyPostsData.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
    </div>
  )
}

export default ListPost
