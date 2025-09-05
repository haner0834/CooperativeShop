//
//  SheetContent.swift
//  CooperativeShops
//
//  Created by Andy Lin on 2025/9/4.
//

import SwiftUI

struct SheetContent: View {
    let verifiedData: QRData
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 20)
                .frame(width: 50, height: 3)
                .opacity(0.15)
                .padding(.bottom)
                .padding(.top, 4)
            
            Row(title: "ID", value: verifiedData.userId)
            
            Row(title: "學校", value: verifiedData.schoolName)
            
            Row(title: "學校（縮寫）", value: verifiedData.schoolAbbreviation)
            
            Divider()
            
            HStack {
                Image(systemName: "checkmark")
                
                Text("驗證成功")
            }
            .font(.callout)
            .fontWeight(.semibold)
            .opacity(0.7)
            .padding(4)
            .padding(.horizontal, 8)
            .background(.green.opacity(0.8))
            .clipShape(.rect(cornerRadius: 50))
        }
        .frame(maxHeight: .infinity, alignment: .top)
        .padding([.horizontal])
    }
}

struct Row: View {
    let title: String
    let value: String
    var body: some View {
        HStack {
            Text(title)
            
            Text(value)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .fontDesign(.monospaced)
    }
}

#Preview {
    ContentView()
}
